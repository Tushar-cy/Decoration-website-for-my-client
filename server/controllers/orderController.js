const { z } = require("zod");
const Order = require("../models/Order");
const Settings = require("../models/Settings");
const Coupon = require("../models/Coupon");
const { Customer, normalizeIndianPhone } = require("../models/Customer");
const { computeQuote } = require("../services/pricingService");
const { reserveSlotAtomic, releaseSlotAtomic } = require("../services/slotService");
const { createRazorpayOrder } = require("../services/razorpayService");
const { enqueueNotification } = require("../queues/orderQueue");
const { parseISTMidnight, formatISTDate, isSameISTDate } = require("../utils/dateUtils");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");
const AppError = require("../utils/AppError");

const orderAddressSchema = z.object({
  line1: z.string().min(1, "Address line1 is required"),
  locality: z.string().optional().default(""),
  pincode: z.string().min(4, "Pincode is required"),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "productId is required"),
        variantSelections: z.union([z.array(z.any()), z.record(z.any())]).optional(),
        addOnIds: z.array(z.string()).optional(),
        quantity: z.number().int().min(1).default(1),
        // Any client-sent prices will be completely ignored by the server
        unitPricePaise: z.any().optional(),
        totalPaise: z.any().optional(),
      })
    )
    .min(1, "At least one item is required to place an order"),
  event: z.object({
    type: z.string().min(1, "Event type is required"),
    date: z.string().min(1, "Event date is required"),
    slotKey: z.string().min(1, "Slot key is required"),
    address: orderAddressSchema,
    notes: z.string().optional().default(""),
  }),
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(7, "Valid phone number is required"),
    email: z.string().email().optional().or(z.literal("")),
  }),
  couponCode: z.string().optional().nullable(),
  source: z.string().optional().default("web"),
});

/**
 * POST /api/orders
 * Atomic order creation flow:
 * 1. Checks Idempotency-Key
 * 2. Recomputes pricing from DB
 * 3. Reserves slot atomically (with upsert & duplicate-key retry)
 * 4. Finds/creates Customer
 * 5. Creates Order
 * 6. Creates Razorpay order
 * 7. On any subsequent failure: Compensating action releases the slot
 */
async function createOrder(req, res, next) {
  let slotReserved = false;
  let reservedDate = null;
  let reservedSlotKey = null;

  try {
    // 1. Validate Idempotency-Key header
    const idempotencyKey = req.headers["idempotency-key"]?.trim();
    if (!idempotencyKey) {
      throw new AppError("Missing required 'Idempotency-Key' header", 400);
    }

    // Check if order was already placed with this idempotency key
    const existingOrder = await Order.findOne({ idempotencyKey }).lean();
    if (existingOrder) {
      logger.info({ orderNumber: existingOrder.orderNumber, idempotencyKey }, "Idempotent order request returned existing order");
      return res.status(200).json({
        status: "success",
        isDuplicate: true,
        data: {
          orderNumber: existingOrder.orderNumber,
          razorpayOrderId: existingOrder.payment?.razorpayOrderId,
          keyId: env?.RAZORPAY_KEY_ID || "",
          amount: existingOrder.pricing.advanceDuePaise,
          totalPaise: existingOrder.pricing.totalPaise,
          status: existingOrder.status,
        },
      });
    }

    // 2. Validate request body
    const validated = createOrderSchema.parse(req.body);

    // 3. Recompute pricing from DB (Single Source of Truth)
    const quote = await computeQuote({
      items: validated.items,
      couponCode: validated.couponCode,
      pincode: validated.event.address.pincode,
      checkServiceable: true,
    });

    // 4. Validate slot and date availability
    const istDate = parseISTMidnight(validated.event.date);
    if (!istDate) {
      throw new AppError("Invalid event date format", 400);
    }

    const settings = await Settings.getSettings();

    // Check blackout dates
    const isBlackout = settings.blackoutDates?.some((bDate) =>
      isSameISTDate(bDate, istDate)
    );
    if (isBlackout) {
      throw new AppError("Selected date is unavailable due to a blackout date", 400);
    }

    // Find slot configuration
    const slotConfig = (settings.slots || []).find((s) => s.key === validated.event.slotKey);
    if (!slotConfig) {
      throw new AppError(`Invalid slot key: '${validated.event.slotKey}'`, 400);
    }
    const slotCapacity = slotConfig.capacityPerDay || 5;

    // 5. Reserve the slot atomically
    await reserveSlotAtomic({
      date: istDate,
      slotKey: validated.event.slotKey,
      capacity: slotCapacity,
    });

    slotReserved = true;
    reservedDate = istDate;
    reservedSlotKey = validated.event.slotKey;

    // 6. Find or create Customer
    const normalizedPhone = normalizeIndianPhone(validated.customer.phone);
    let customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      customer = await Customer.create({
        name: validated.customer.name,
        phone: normalizedPhone,
        email: validated.customer.email || "",
        addresses: [validated.event.address],
      });
    } else {
      if (validated.customer.email && !customer.email) {
        customer.email = validated.customer.email;
        await customer.save();
      }
    }

    // 7. Create the Order
    const orderItems = quote.items.map((it) => ({
      productId: it.productId,
      titleSnapshot: it.titleSnapshot,
      variantSelections: it.variantSelections,
      unitPricePaise: it.unitPricePaise,
      quantity: it.quantity,
      addOns: it.addOns,
    }));

    const orderDoc = new Order({
      customerId: customer._id,
      customerSnapshot: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
      },
      items: orderItems,
      event: {
        type: validated.event.type,
        date: istDate,
        slotKey: validated.event.slotKey,
        address: validated.event.address,
        notes: validated.event.notes || "",
      },
      pricing: quote.pricing,
      coupon: quote.coupon.valid
        ? { code: quote.coupon.code, discountPaise: quote.coupon.discountPaise }
        : { code: null, discountPaise: 0 },
      payment: {
        status: "unpaid",
        razorpayOrderId: null,
        razorpayPaymentId: null,
        paidPaise: 0,
      },
      status: "pending",
      idempotencyKey,
      source: validated.source || "web",
      statusHistory: [
        {
          status: "pending",
          at: new Date(),
          by: "customer",
          note: "Order created online",
        },
      ],
    });

    await orderDoc.save();

    // 8. If coupon was valid, increment coupon usage count
    if (quote.couponDoc && quote.coupon.valid) {
      await Coupon.updateOne(
        { _id: quote.couponDoc._id },
        { $inc: { usedCount: 1 } }
      );
    }

    // 9. Create Razorpay order if advance payment is online
    if (
      settings.paymentMode === "advance_online" &&
      orderDoc.pricing.advanceDuePaise > 0
    ) {
      const razorpayOrderId = await createRazorpayOrder({
        amountPaise: orderDoc.pricing.advanceDuePaise,
        receipt: orderDoc.orderNumber,
        notes: {
          orderNumber: orderDoc.orderNumber,
          phone: customer.phone,
        },
      });

      orderDoc.payment.razorpayOrderId = razorpayOrderId;
      await orderDoc.save();
    }

    // 10. Enqueue asynchronous order placed notification
    await enqueueNotification("ORDER_CREATED", {
      orderId: orderDoc._id.toString(),
      orderNumber: orderDoc.orderNumber,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      totalPaise: orderDoc.pricing.totalPaise,
    });

    // 11. Return strictly whitelisted client view
    return res.status(201).json({
      status: "success",
      data: {
        orderNumber: orderDoc.orderNumber,
        razorpayOrderId: orderDoc.payment.razorpayOrderId,
        keyId: env?.RAZORPAY_KEY_ID || "",
        amount: orderDoc.pricing.advanceDuePaise,
        totalPaise: orderDoc.pricing.totalPaise,
        status: orderDoc.status,
      },
    });
  } catch (error) {
    // Compensating action: Release slot if reserved before error occurred
    if (slotReserved && reservedDate && reservedSlotKey) {
      try {
        await releaseSlotAtomic({
          date: reservedDate,
          slotKey: reservedSlotKey,
        });
        logger.info({ reservedDate, reservedSlotKey }, "Compensating action: Successfully released reserved slot");
      } catch (releaseErr) {
        logger.error({ releaseErr }, "Failed compensating action to release slot");
      }
    }
    next(error);
  }
}

const trackQuerySchema = z.object({
  orderNumber: z.string().min(1, "orderNumber is required"),
  phone: z.string().min(7, "phone is required"),
});

/**
 * GET /api/orders/track?orderNumber=&phone=
 * Limited public order tracking view.
 */
async function trackOrder(req, res, next) {
  try {
    const validated = trackQuerySchema.parse(req.query);
    const normalizedPhone = normalizeIndianPhone(validated.phone);

    const order = await Order.findOne({
      orderNumber: validated.orderNumber.trim(),
      "customerSnapshot.phone": normalizedPhone,
    }).lean();

    if (!order) {
      throw new AppError("No order found matching the provided order number and phone", 404);
    }

    return res.status(200).json({
      status: "success",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        event: {
          type: order.event.type,
          date: formatISTDate(order.event.date),
          slotKey: order.event.slotKey,
        },
        items: (order.items || []).map((it) => ({
          titleSnapshot: it.titleSnapshot,
          quantity: it.quantity,
          variantSelections: it.variantSelections,
        })),
        pricing: {
          subtotalPaise: order.pricing.subtotalPaise,
          discountPaise: order.pricing.discountPaise,
          deliveryFeePaise: order.pricing.deliveryFeePaise,
          totalPaise: order.pricing.totalPaise,
          advanceDuePaise: order.pricing.advanceDuePaise,
        },
        payment: {
          status: order.payment.status,
          paidPaise: order.payment.paidPaise,
        },
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  trackOrder,
};
