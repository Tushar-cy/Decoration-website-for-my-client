const { z } = require("zod");
const Settings = require("../models/Settings");
const { recordAudit } = require("../services/auditService");
const { parseISTMidnight } = require("../utils/dateUtils");
const AppError = require("../utils/AppError");

const slotConfigSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:mm"),
  capacityPerDay: z.number().int().min(1).default(5),
});

const pincodeSchema = z.object({
  pincode: z.string().min(4),
  deliveryFeePaise: z.number().int().min(0).default(0),
});

const settingsUpdateSchema = z.object({
  slots: z.array(slotConfigSchema).optional(),
  blackoutDates: z.array(z.string()).optional(),
  serviceablePincodes: z.array(pincodeSchema).optional(),
  advancePercent: z.number().min(0).max(100).optional(),
  paymentMode: z.enum(["advance_online", "pay_on_confirmation"]).optional(),
  notificationEmails: z.array(z.string().email()).optional(),
  business: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
    .optional(),
  socials: z.record(z.string()).optional(),
  homepage: z.record(z.any()).optional(),
});

/**
 * GET /api/admin/settings
 */
async function getSettings(req, res, next) {
  try {
    const settings = await Settings.getSettings();
    return res.status(200).json({
      status: "success",
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/settings
 * Owner only. Updates slots, capacity, blackout dates, payment modes, and serviceable pincodes.
 */
async function updateSettings(req, res, next) {
  try {
    const validated = settingsUpdateSchema.parse(req.body);
    const settings = await Settings.getSettings();
    const before = settings.toObject();

    if (validated.slots) {
      settings.slots = validated.slots;
    }

    if (validated.blackoutDates) {
      settings.blackoutDates = validated.blackoutDates
        .map((d) => parseISTMidnight(d))
        .filter(Boolean);
    }

    if (validated.serviceablePincodes) {
      settings.serviceablePincodes = validated.serviceablePincodes;
    }

    if (validated.advancePercent !== undefined) {
      settings.advancePercent = validated.advancePercent;
    }

    if (validated.paymentMode) {
      settings.paymentMode = validated.paymentMode;
    }

    if (validated.notificationEmails) {
      settings.notificationEmails = validated.notificationEmails;
    }

    if (validated.business) {
      settings.business = { ...settings.business.toObject(), ...validated.business };
    }

    if (validated.socials) {
      settings.socials = { ...settings.socials.toObject(), ...validated.socials };
    }

    if (validated.homepage) {
      settings.homepage = { ...settings.homepage.toObject(), ...validated.homepage };
    }

    await settings.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "SETTINGS_UPDATED",
      entity: "Settings",
      entityId: settings._id,
      before,
      after: settings.toObject(),
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
};
