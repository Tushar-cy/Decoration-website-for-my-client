const { z } = require("zod");

const slotConfigSchema = z.object({
  key: z.string().min(1, "Slot key is required"),
  label: z.string().min(1, "Slot label is required"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  capacityPerDay: z.number().int().min(1, "Capacity must be at least 1").default(5),
});

const serviceablePincodeSchema = z.object({
  pincode: z.string().regex(/^122\d{3}$/, "Must be a valid Gurugram pincode (122xxx)"),
  deliveryFeePaise: z.number().int().min(0, "Delivery fee must be non-negative paise").default(0),
});

const businessSettingsSchema = z.object({
  name: z.string().min(1).default("Decor Joy Gurgaon"),
  phone: z.string().min(10).default("+917015767715"),
  whatsapp: z.string().min(10).default("+917015767715"),
  email: z.string().email().default("decorjoygurgaon@gmail.com"),
  address: z.string().min(5).default("166GF, Sector 57, Housing Board Colony, Gurugram, Haryana"),
  geo: z.object({
    lat: z.number().default(28.435),
    lng: z.number().default(77.086),
  }).default({ lat: 28.435, lng: 77.086 }),
});

const updateSettingsSchema = z.object({
  business: businessSettingsSchema.partial().optional(),
  slots: z.array(slotConfigSchema).optional(),
  blackoutDates: z.array(z.string().or(z.date())).optional(),
  serviceablePincodes: z.array(serviceablePincodeSchema).optional(),
  advancePercent: z.number().min(0).max(100).optional(),
  paymentMode: z.enum(["advance_online", "pay_on_confirmation"]).optional(),
  notificationEmails: z.array(z.string().email()).optional(),
  socials: z.object({
    instagram: z.string().optional().default(""),
    facebook: z.string().optional().default(""),
    youtube: z.string().optional().default(""),
  }).optional(),
  homepage: z.object({
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
    blocks: z.array(z.any()).optional(),
  }).optional(),
});

module.exports = {
  slotConfigSchema,
  serviceablePincodeSchema,
  businessSettingsSchema,
  updateSettingsSchema,
};
