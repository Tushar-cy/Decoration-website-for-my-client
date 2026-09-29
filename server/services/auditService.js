const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

async function recordAudit({
  actorId = null,
  action,
  entity,
  entityId,
  before = null,
  after = null,
  ip = "",
}) {
  try {
    await AuditLog.create({
      actorId: actorId?.toString() || null,
      action,
      entity,
      entityId: entityId?.toString() || String(entityId),
      before,
      after,
      ip: ip || "",
      at: new Date(),
    });
  } catch (err) {
    logger.error({ err, action, entity, entityId }, "Failed to write audit log entry");
  }
}

module.exports = {
  recordAudit,
};
