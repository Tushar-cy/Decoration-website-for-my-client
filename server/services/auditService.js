const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");
const cache = require("../utils/cache");

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

    // Invalidate Redis cache tags automatically on mutating entity writes
    if (entity === "Product" || entity === "Category" || entity === "AddOn") {
      await cache.invalidateTags(["products", "categories", "addons"]);
    } else if (entity === "Settings") {
      await cache.invalidateTags(["settings", "availability"]);
    } else if (entity === "FormSchema") {
      await cache.invalidateTags(["forms"]);
    } else if (entity === "Gallery") {
      await cache.invalidateTags(["gallery"]);
    } else if (entity === "Testimonial") {
      await cache.invalidateTags(["testimonials"]);
    } else if (entity === "Order") {
      await cache.invalidateTags(["availability"]);
    }
  } catch (err) {
    logger.error({ err, action, entity, entityId }, "Failed to write audit log entry");
  }
}

module.exports = {
  recordAudit,
};
