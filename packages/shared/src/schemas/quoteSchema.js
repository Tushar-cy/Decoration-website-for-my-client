const { z } = require("zod");

const quoteItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  variantSelections: z.union([z.array(z.any()), z.record(z.any())]).optional().default([]),
  addOnIds: z.array(z.string()).optional().default([]),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

const generateQuoteSchema = z.object({
  items: z.array(quoteItemSchema).min(1, "Items array cannot be empty"),
  couponCode: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
});

module.exports = {
  quoteItemSchema,
  generateQuoteSchema,
};
