const { z } = require("zod");

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  productId: z.string().optional(),
  pincode: z.string().optional(),
});

const slotCapacityUpdateSchema = z.object({
  slotKey: z.string().min(1, "slotKey is required"),
  capacityPerDay: z.number().int().min(1).max(50),
});

const toggleBlockDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

module.exports = {
  availabilityQuerySchema,
  slotCapacityUpdateSchema,
  toggleBlockDateSchema,
};
