const { z } = require("zod");
const Submission = require("../models/Submission");
const { recordAudit } = require("../services/auditService");
const AppError = require("../utils/AppError");

/**
 * GET /api/admin/submissions
 * Filterable and paginated list of submissions.
 */
async function getSubmissions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.formKey && req.query.formKey !== "all") {
      filter.formKey = req.query.formKey.toLowerCase();
    }

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    if (req.query.q) {
      const q = String(req.query.q).trim();
      const qRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: qRegex }, { phone: qRegex }, { email: qRegex }];
    }

    // Cursor pagination support
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .select("formKey formTitle version status name phone email answersSnapshot assignedTo notes tags createdAt updatedAt")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 })
        .skip(req.query.cursor ? 0 : skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    const nextCursor = submissions.length === limit ? submissions[submissions.length - 1]._id : null;

    return res.status(200).json({
      status: "success",
      data: {
        submissions,
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
 * GET /api/admin/submissions/:id
 */
async function getSubmissionById(req, res, next) {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("convertedOrderId", "orderNumber status pricing")
      .lean();

    if (!submission) {
      throw new AppError(`Submission '${req.params.id}' not found`, 404);
    }

    return res.status(200).json({
      status: "success",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "quoted", "converted", "lost"]),
});

/**
 * PATCH /api/admin/submissions/:id/status
 */
async function updateSubmissionStatus(req, res, next) {
  try {
    const { status } = statusSchema.parse(req.body);
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      throw new AppError(`Submission '${req.params.id}' not found`, 404);
    }

    const prevStatus = submission.status;
    submission.status = status;
    await submission.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "SUBMISSION_STATUS_UPDATED",
      entity: "Submission",
      entityId: submission._id,
      before: { status: prevStatus },
      after: { status: submission.status },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

const noteSchema = z.object({
  text: z.string().min(1, "Note text cannot be empty"),
});

/**
 * POST /api/admin/submissions/:id/notes
 */
async function addSubmissionNote(req, res, next) {
  try {
    const { text } = noteSchema.parse(req.body);
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      throw new AppError(`Submission '${req.params.id}' not found`, 404);
    }

    const newNote = {
      by: req.admin?.name || req.admin?.email || "Staff",
      text,
      at: new Date(),
    };

    submission.notes.push(newNote);
    await submission.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "SUBMISSION_NOTE_ADDED",
      entity: "Submission",
      entityId: submission._id,
      before: null,
      after: newNote,
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

const assignSchema = z.object({
  assignedTo: z.string().nullable(),
});

/**
 * PATCH /api/admin/submissions/:id/assign
 */
async function assignSubmission(req, res, next) {
  try {
    const { assignedTo } = assignSchema.parse(req.body);
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      throw new AppError(`Submission '${req.params.id}' not found`, 404);
    }

    const prevAssigned = submission.assignedTo;
    submission.assignedTo = assignedTo || null;
    await submission.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "SUBMISSION_ASSIGNED",
      entity: "Submission",
      entityId: submission._id,
      before: { assignedTo: prevAssigned },
      after: { assignedTo: submission.assignedTo },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

const convertSchema = z.object({
  orderId: z.string().min(1, "Order ID is required to link converted order"),
});

/**
 * POST /api/admin/submissions/:id/convert
 */
async function convertSubmissionToOrder(req, res, next) {
  try {
    const { orderId } = convertSchema.parse(req.body);
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      throw new AppError(`Submission '${req.params.id}' not found`, 404);
    }

    submission.convertedOrderId = orderId;
    submission.status = "converted";
    await submission.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "SUBMISSION_CONVERTED_TO_ORDER",
      entity: "Submission",
      entityId: submission._id,
      before: null,
      after: { convertedOrderId: orderId, status: "converted" },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/submissions/export.csv
 */
async function exportSubmissionsCsv(req, res, next) {
  try {
    const filter = {};
    if (req.query.formKey && req.query.formKey !== "all") {
      filter.formKey = req.query.formKey.toLowerCase();
    }
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    const submissions = await Submission.find(filter).sort({ createdAt: -1 }).lean();

    const headers = [
      "Submission ID",
      "Purpose Key",
      "Customer Name",
      "Phone",
      "Email",
      "Status",
      "Event Date",
      "Created At (UTC)",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = submissions.map((s) => [
      escapeCsv(s._id),
      escapeCsv(s.formKey),
      escapeCsv(s.name),
      escapeCsv(s.phone),
      escapeCsv(s.email),
      escapeCsv(s.status),
      escapeCsv(s.answers?.event_date || s.answers?.eventDate || "N/A"),
      escapeCsv(new Date(s.createdAt).toISOString()),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="submissions-export.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  addSubmissionNote,
  assignSubmission,
  convertSubmissionToOrder,
  exportSubmissionsCsv,
};
