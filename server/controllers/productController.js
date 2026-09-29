const { z } = require("zod");
const Product = require("../models/Product");
const Category = require("../models/Category");
const AddOn = require("../models/AddOn");
const AppError = require("../utils/AppError");

/**
 * GET /api/products
 * Public products catalog with search, category filtering, price filtering, and pagination.
 */
async function getPublicProducts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

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
      }).lean();

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

    // Price range filters (in paise or rupees)
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

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .populate("addOnIds", "name pricePaise image")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
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

    return res.status(200).json({
      status: "success",
      data: {
        product,
        related,
      },
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
    const categories = await Category.find({ isActive: true, deletedAt: null })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

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
    const addOns = await AddOn.find({ isActive: true, deletedAt: null })
      .sort({ name: 1 })
      .lean();

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
