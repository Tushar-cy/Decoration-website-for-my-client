const { z } = require("zod");
const Order = require("../models/Order");
const Settings = require("../models/Settings");
const { reserveSlotAtomic, releaseSlotAtomic } = require("../services/slotService");
const { issueRefund } = require("../services/razorpayService");
const { recordAudit } = require("../services/auditService");
const { parseISTMidnight, formatISTDate } = require("../utils/dateUtils");
const AppError = require("../utils/AppError");

// State machine definition
const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Validates whether a state transition is legal according to the state machine
 */
function isValidStateTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

/**
 * GET /api/admin/orders
 * Paginated list of orders with rich filtering & sorting
 */
async function getOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      filter["payment.status"] = req.query.paymentStatus;
    }

    // Date range filter
    const dateField = req.query.dateField === "createdAt" ? "createdAt" : "event.date";
    if (req.query.from || req.query.to) {
      filter[dateField] = {};
      if (req.query.from) {
        filter[dateField].$gte = dateField === "createdAt"
          ? new Date(req.query.from)
          : parseISTMidnight(req.query.from);
      }
      if (req.query.to) {
        filter[dateField].$lte = dateField === "createdAt"
          ? new Date(req.query.to)
          : parseISTMidnight(req.query.to);
      }
    }

    // Search query on orderNumber, customer name, or phone
    if (req.query.q) {
      const q = String(req.query.q).trim();
      const qRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { orderNumber: qRegex },
        { "customerSnapshot.name": qRegex },
        { "customerSnapshot.phone": qRegex },
      ];
    }

    // Sorting
    let sort = { "event.date": 1 };
    if (req.query.sortBy === "createdDate" || req.query.sortBy === "createdAt") {
      const order = req.query.sortOrder === "asc" ? 1 : -1;
      sort = { createdAt: order };
    } else if (req.query.sortBy === "eventDate") {
      const order = req.query.sortOrder === "desc" ? -1 : 1;
      sort = { "event.date": order };
    }

    // Cursor pagination support for scalable infinite feeds / high load
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(req.query.cursor ? 0 : skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const nextCursor = orders.length === limit ? orders[orders.length - 1]._id : null;

    return res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          nextCursor,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/orders/:id
 */
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId")
      .lean();

    if (!order) {
      throw new AppError(`Order with ID '${req.params.id}' not found`, 404);
    }

    return res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

const statusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  note: z.string().optional().default(""),
});

/**
 * PATCH /api/admin/orders/:id/status
 * Enforces the state machine.
 * When status moves to cancelled, automatically releases the reserved slot.
 */
async function updateOrderStatus(req, res, next) {
  try {
    const validated = statusUpdateSchema.parse(req.body);
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(`Order with ID '${req.params.id}' not found`, 404);
    }

    const currentStatus = order.status;
    const nextStatus = validated.status;

    if (!isValidStateTransition(currentStatus, nextStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${nextStatus}'`,
        409
      );
    }

    // If cancelling, release the slot
    if (nextStatus === "cancelled" && currentStatus !== "cancelled") {
      if (order.event?.date && order.event?.slotKey) {
        await releaseSlotAtomic({
          date: order.event.date,
          slotKey: order.event.slotKey,
        });
      }
    }

    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      at: new Date(),
      by: req.admin?.email || "admin",
      note: validated.note || `Status updated to ${nextStatus}`,
    });

    await order.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "ORDER_STATUS_UPDATE",
      entity: "Order",
      entityId: order._id,
      before: { status: currentStatus },
      after: { status: nextStatus },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
}

const updateDetailsSchema = z.object({
  notes: z.string().optional(),
  date: z.string().optional(),
  slotKey: z.string().optional(),
});

/**
 * PATCH /api/admin/orders/:id
 * For updating order notes and rescheduling.
 * Rescheduling moves the slot atomically: reserves new one first, then releases old one.
 */
async function updateOrderDetails(req, res, next) {
  try {
    const validated = updateDetailsSchema.parse(req.body);
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(`Order with ID '${req.params.id}' not found`, 404);
    }

    const beforeState = {
      notes: order.event?.notes,
      date: order.event?.date,
      slotKey: order.event?.slotKey,
    };

    if (validated.notes !== undefined) {
      order.event.notes = validated.notes;
    }

    // Handle Rescheduling
    const isRescheduling =
      (validated.date && formatISTDate(order.event.date) !== validated.date) ||
      (validated.slotKey && order.event.slotKey !== validated.slotKey);

    if (isRescheduling) {
      const newDate = validated.date
        ? parseISTMidnight(validated.date)
        : order.event.date;
      const newSlotKey = validated.slotKey || order.event.slotKey;

      if (!newDate) {
        throw new AppError("Invalid new date for reschedule", 400);
      }

      const settings = await Settings.getSettings();
      const slotConfig = (settings.slots || []).find((s) => s.key === newSlotKey);
      if (!slotConfig) {
        throw new AppError(`Invalid slot key '${newSlotKey}'`, 400);
      }
      const capacity = slotConfig.capacityPerDay || 5;

      // 1. Reserve new slot first (fails if full)
      await reserveSlotAtomic({
        date: newDate,
        slotKey: newSlotKey,
        capacity,
      });

      // 2. Release old slot
      await releaseSlotAtomic({
        date: order.event.date,
        slotKey: order.event.slotKey,
      });

      // 3. Update order
      order.event.date = newDate;
      order.event.slotKey = newSlotKey;

      order.statusHistory.push({
        status: order.status,
        at: new Date(),
        by: req.admin?.email || "admin",
        note: `Rescheduled to ${formatISTDate(newDate)} (${newSlotKey})`,
      });
    }

    await order.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: isRescheduling ? "ORDER_RESCHEDULED" : "ORDER_DETAILS_UPDATED",
      entity: "Order",
      entityId: order._id,
      before: beforeState,
      after: {
        notes: order.event.notes,
        date: order.event.date,
        slotKey: order.event.slotKey,
      },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

const refundSchema = z.object({
  amountPaise: z.number().int().min(1).optional(),
  reason: z.string().optional().default("Admin refund"),
});

/**
 * POST /api/admin/orders/:id/refund
 * Owner only. Calls Razorpay refund (full or partial).
 */
async function refundOrder(req, res, next) {
  try {
    const validated = refundSchema.parse(req.body);
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(`Order with ID '${req.params.id}' not found`, 404);
    }

    const paymentId = order.payment?.razorpayPaymentId;
    if (!paymentId) {
      throw new AppError("Cannot refund order: No recorded Razorpay payment ID", 400);
    }

    const refundAmount = validated.amountPaise || order.payment.paidPaise;
    if (refundAmount <= 0) {
      throw new AppError("Invalid refund amount", 400);
    }

    const refundResult = await issueRefund({
      paymentId,
      amountPaise: refundAmount,
      notes: {
        orderNumber: order.orderNumber,
        reason: validated.reason,
      },
    });

    const prevPayment = { ...order.payment.toObject() };
    order.payment.status = refundAmount >= order.payment.paidPaise ? "refunded" : "paid";
    order.payment.paidPaise = Math.max(0, order.payment.paidPaise - refundAmount);

    order.statusHistory.push({
      status: order.status,
      at: new Date(),
      by: req.admin?.email || "owner",
      note: `Issued refund of ₹${(refundAmount / 100).toFixed(2)}. Razorpay Refund ID: ${refundResult.id}`,
    });

    await order.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "ORDER_REFUND",
      entity: "Order",
      entityId: order._id,
      before: prevPayment,
      after: {
        payment: order.payment,
        refundId: refundResult.id,
        refundAmount,
      },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: {
        order,
        refund: refundResult,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/orders/export.csv
 * Exports orders matching current filters as a CSV download.
 * Hard-limited to 10,000 rows to prevent unbounded DB scan / OOM.
 */
async function exportOrdersCsv(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter["payment.status"] = req.query.paymentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(10000).lean();

    const headers = [
      "Order Number",
      "Status",
      "Payment Status",
      "Customer Name",
      "Customer Phone",
      "Event Date (IST)",
      "Slot",
      "Subtotal (INR)",
      "Discount (INR)",
      "Delivery Fee (INR)",
      "Total (INR)",
      "Paid (INR)",
      "Created At",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = orders.map((o) => [
      escapeCsv(o.orderNumber),
      escapeCsv(o.status),
      escapeCsv(o.payment?.status),
      escapeCsv(o.customerSnapshot?.name),
      escapeCsv(o.customerSnapshot?.phone),
      escapeCsv(formatISTDate(o.event?.date)),
      escapeCsv(o.event?.slotKey),
      escapeCsv(((o.pricing?.subtotalPaise || 0) / 100).toFixed(2)),
      escapeCsv(((o.pricing?.discountPaise || 0) / 100).toFixed(2)),
      escapeCsv(((o.pricing?.deliveryFeePaise || 0) / 100).toFixed(2)),
      escapeCsv(((o.pricing?.totalPaise || 0) / 100).toFixed(2)),
      escapeCsv(((o.payment?.paidPaise || 0) / 100).toFixed(2)),
      escapeCsv(new Date(o.createdAt).toISOString()),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="orders-export.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderDetails,
  refundOrder,
  exportOrdersCsv,
  isValidStateTransition,
};
