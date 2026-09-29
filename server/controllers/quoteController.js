const { z } = require("zod");
const { computeQuote } = require("../services/pricingService");

const quoteItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  variantSelections: z.union([z.array(z.any()), z.record(z.any())]).optional(),
  addOnIds: z.array(z.string()).optional(),
  quantity: z.number().int().min(1).default(1),
});

const quoteBodySchema = z.object({
  items: z.array(quoteItemSchema).min(1, "Items array cannot be empty"),
  couponCode: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
});

/**
 * POST /api/quotes
 * Recomputes prices, add-ons, delivery fee, and coupons from DB.
 * Single source of truth called on cart state mutations.
 */
async function generateQuote(req, res, next) {
  try {
    const validated = quoteBodySchema.parse(req.body);

    const quote = await computeQuote({
      items: validated.items,
      couponCode: validated.couponCode,
      pincode: validated.pincode,
      checkServiceable: false,
    });

    return res.status(200).json({
      status: "success",
      data: {
        items: quote.items,
        pricing: quote.pricing,
        coupon: quote.coupon,
        pincode: quote.pincode,
        paymentMode: quote.paymentMode,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateQuote,
};
