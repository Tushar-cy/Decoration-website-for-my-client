const AuditLog = require("../models/AuditLog");

/**
 * GET /api/admin/audit-logs
 * Filters by entity, action, date range, with pagination.
 */
async function getAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.entity && req.query.entity !== "all") {
      filter.entity = req.query.entity;
    }

    if (req.query.action && req.query.action !== "all") {
      filter.action = req.query.action;
    }

    if (req.query.from || req.query.to) {
      filter.at = {};
      if (req.query.from) filter.at.$gte = new Date(req.query.from);
      if (req.query.to) filter.at.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs,
};
