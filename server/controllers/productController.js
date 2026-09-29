const Product = require("../models/Product");
const Category = require("../models/Category");
const AddOn = require("../models/AddOn");
const AppError = require("../utils/AppError");
const cache = require("../utils/cache");

/**
 * GET /api/products
 * Public products catalog with search, category filtering, price filtering, and pagination.
 * Cached via Redis with single-flight locking, stale-if-error, and lean/select projections.
 */
async function getPublicProducts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const cacheKey = cache.buildCacheKey("products", req.query);

    const result = await cache.wrap(
      cacheKey,
      120, // 2 minutes TTL
      async () => {
        const filter = {
          isActive: true,
          deletedAt: null,
        };

        // Category filter
        if (req.query.category && req.query.category !== "All") {
          const cat = await Category.findOne({
            $or: [
              { slug: req.query.category.toLowerCase().trim() },
              { name: new RegExp(`^${req.query.category.trim()}$`, "i") },
            ],
          })
            .select("_id")
            .lean();

          if (cat) {
            filter.categoryId = cat._id;
          }
        }

        // Search query
        if (req.query.q && req.query.q.trim()) {
          const q = req.query.q.trim();
          filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q, "i")] } },
            { shortDescription: { $regex: q, $options: "i" } },
          ];
        }

        // Price range filters
        if (req.query.minPrice) {
          const minPaise = parseInt(req.query.minPrice, 10) * 100;
          if (!isNaN(minPaise)) {
            filter.basePricePaise = { ...filter.basePricePaise, $gte: minPaise };
          }
        }
        if (req.query.maxPrice) {
          const maxPaise = parseInt(req.query.maxPrice, 10) * 100;
          if (!isNaN(maxPaise)) {
            filter.basePricePaise = { ...filter.basePricePaise, $lte: maxPaise };
          }
        }

        // Sorting
        let sort = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
        if (req.query.sort === "price_asc") sort = { basePricePaise: 1 };
        if (req.query.sort === "price_desc") sort = { basePricePaise: -1 };
        if (req.query.sort === "rating") sort = { ratingAvg: -1, ratingCount: -1 };
        if (req.query.sort === "newest") sort = { createdAt: -1 };

        // Lean and select projections: exclude heavy description & full variant configurations in list view
        const [products, total] = await Promise.all([
          Product.find(filter)
            .select(
              "title slug categoryId basePricePaise compareAtPricePaise images badge isFeatured ratingAvg ratingCount setupMinutes minLeadHours tags isActive sortOrder"
            )
            .populate("categoryId", "name slug")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(filter),
        ]);

        return {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        };
      },
      { tags: ["products"] }
    );

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:slug
 */
async function getProductBySlug(req, res, next) {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const cacheKey = cache.buildCacheKey("product_detail", { slug });

    const result = await cache.wrap(
      cacheKey,
      300, // 5 minutes TTL
      async () => {
        const product = await Product.findOne({
          slug,
          deletedAt: null,
        })
          .populate("categoryId", "name slug")
          .populate("addOnIds", "name pricePaise image")
          .lean();

        if (!product) {
          throw new AppError(`Product '${slug}' not found`, 404);
        }

        // Fetch related products in the same category
        const related = await Product.find({
          categoryId: product.categoryId?._id || product.categoryId,
          _id: { $ne: product._id },
          isActive: true,
          deletedAt: null,
        })
          .limit(4)
          .select("title slug basePricePaise images ratingAvg ratingCount badge")
          .lean();

        return {
          product,
          related,
        };
      },
      { tags: ["products"] }
    );

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/categories
 */
async function getPublicCategories(req, res, next) {
  try {
    const cacheKey = cache.buildCacheKey("categories", req.query);

    const categories = await cache.wrap(
      cacheKey,
      600, // 10 minutes TTL
      async () => {
        return await Category.find({ isActive: true, deletedAt: null })
          .select("name slug image sortOrder isActive")
          .sort({ sortOrder: 1, name: 1 })
          .lean();
      },
      { tags: ["categories"] }
    );

    return res.status(200).json({
      status: "success",
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/addons
 */
async function getPublicAddOns(req, res, next) {
  try {
    const cacheKey = cache.buildCacheKey("addons", req.query);

    const addOns = await cache.wrap(
      cacheKey,
      600, // 10 minutes TTL
      async () => {
        return await AddOn.find({ isActive: true, deletedAt: null })
          .select("name pricePaise image isActive")
          .sort({ name: 1 })
          .lean();
      },
      { tags: ["addons"] }
    );

    return res.status(200).json({
      status: "success",
      data: { addOns },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicProducts,
  getProductBySlug,
  getPublicCategories,
  getPublicAddOns,
};
