const Category = require("../models/Category");
const Product = require("../models/Product");
const FormSchema = require("../models/FormSchema");
const Settings = require("../models/Settings");
const cache = require("./cache");
const { logger } = require("./logger");

/**
 * Pre-populates Redis edge cache with hot catalogue and config data
 */
async function warmUpCache() {
  try {
    // 1. Categories
    await cache.wrap(
      "cache:categories:all",
      300,
      async () => {
        return Category.find({ isActive: true, deletedAt: null })
          .sort({ sortOrder: 1, name: 1 })
          .select("name slug description image sortOrder")
          .lean();
      },
      { tags: ["categories"], forceFresh: true }
    );

    // 2. Public Settings
    await cache.wrap(
      "cache:settings:public",
      600,
      async () => {
        const settings = await Settings.getSettings();
        return {
          business: {
            name: settings.business?.name || "Decor Joy Gurgaon",
            phone: settings.business?.phone || "+91 7015767715",
            whatsapp: settings.business?.whatsapp || "+91 7015767715",
            email: settings.business?.email || "decorjoygurgaon@gmail.com",
            address: settings.business?.address || "166GF Sector 57 Gurugram, Haryana 122003",
            geo: settings.business?.geo || { lat: 28.435, lng: 77.086 },
            openingHours: settings.business?.openingHours || "Mo-Su 08:00-22:00",
            googleReviewUrl: settings.business?.googleReviewUrl || "https://g.page/r/decorjoygurgaon/review",
            sameAs: [
              settings.socials?.instagram,
              settings.socials?.facebook,
              settings.socials?.youtube,
            ].filter(Boolean),
          },
          serviceablePincodes: (settings.serviceablePincodes || []).map((p) => ({
            pincode: p.pincode,
            deliveryFeePaise: p.deliveryFeePaise,
          })),
          socials: settings.socials || {},
        };
      },
      { tags: ["settings"], forceFresh: true }
    );

    // 3. Active purpose forms
    await cache.wrap(
      "cache:forms:active",
      600,
      async () => {
        const forms = await FormSchema.find({ isActive: true })
          .select("key title description version fields successMessage")
          .lean();
        return forms.map((f) => ({
          key: f.key,
          title: f.title,
          description: f.description,
          version: f.version,
          fieldCount: (f.fields || []).length,
        }));
      },
      { tags: ["forms"], forceFresh: true }
    );

    // 4. Products catalogue page 1
    await cache.wrap(
      cache.buildCacheKey("products", {}),
      120,
      async () => {
        const [products, total] = await Promise.all([
          Product.find({ isActive: true, deletedAt: null })
            .select(
              "title slug categoryId basePricePaise compareAtPricePaise images badge isFeatured ratingAvg ratingCount setupMinutes minLeadHours tags isActive sortOrder"
            )
            .populate("categoryId", "name slug")
            .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
            .limit(20)
            .lean(),
          Product.countDocuments({ isActive: true, deletedAt: null }),
        ]);

        return {
          products,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20) || 1,
          },
        };
      },
      { tags: ["products"], forceFresh: true }
    );

    logger.info("Cache warmup successfully populated hot catalogue and config entries in Redis.");
  } catch (err) {
    logger.warn({ err: err.message }, "Cache warmup failed to refresh some keys");
  }
}

module.exports = { warmUpCache };
