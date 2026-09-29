const { z } = require("zod");
const { getAvailability } = require("../services/slotService");
const cache = require("../utils/cache");

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  productId: z.string().optional(),
  pincode: z.string().optional(),
});

/**
 * GET /api/availability?date=YYYY-MM-DD&productId=&pincode=
 * Returns each slot with remaining capacity, respecting blackout dates,
 * minLeadHours, and pincode serviceability. Cached for 15s.
 */
async function checkAvailability(req, res, next) {
  try {
    const validated = querySchema.parse(req.query);

    const cacheKey = cache.buildCacheKey("availability", validated);
    const data = await cache.wrap(
      cacheKey,
      15, // 15s TTL
      async () => {
        return await getAvailability({
          dateStr: validated.date,
          productId: validated.productId,
          pincode: validated.pincode,
        });
      },
      { tags: ["availability"] }
    );

    res.set("Cache-Control", "public, max-age=15, s-maxage=15, stale-while-revalidate=60");
    return res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkAvailability,
};
