const crypto = require("crypto");
const { z } = require("zod");
const Product = require("../models/Product");
const Category = require("../models/Category");
const AddOn = require("../models/AddOn");
const { recordAudit } = require("../services/auditService");
const AppError = require("../utils/AppError");

// Zod schemas
const variantOptionSchema = z.object({
  label: z.string().min(1),
  priceDeltaPaise: z.number().int().default(0),
  colorCode: z.string().optional().default(""),
});

const variantSchema = z.object({
  name: z.string().min(1),
  options: z.array(variantOptionSchema).min(1),
});

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().default(""),
  alt: z.string().optional().default(""),
});

const productInputSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  categoryId: z.string().min(1),
  shortDescription: z.string().optional().default(""),
  description: z.string().min(5),
  basePricePaise: z.number().int().min(0),
  compareAtPricePaise: z.number().int().nullable().optional(),
  images: z.array(imageSchema).optional().default([]),
  variants: z.array(variantSchema).optional().default([]),
  includedItems: z.array(z.string()).optional().default([]),
  addOnIds: z.array(z.string()).optional().default([]),
  setupMinutes: z.number().int().min(0).default(90),
  minLeadHours: z.number().int().min(0).default(24),
  badge: z.string().optional().default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string()).optional().default([]),
  seo: z
    .object({
      title: z.string().optional().default(""),
      description: z.string().optional().default(""),
    })
    .optional(),
});

/**
 * GET /api/admin/products
 */
async function getAdminProducts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.deleted === "true") {
      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
    }

    if (req.query.category && req.query.category !== "all") {
      filter.categoryId = req.query.category;
    }

    if (req.query.status === "active") filter.isActive = true;
    if (req.query.status === "inactive") filter.isActive = false;

    if (req.query.q) {
      filter.$or = [
        { title: { $regex: req.query.q.trim(), $options: "i" } },
        { slug: { $regex: req.query.q.trim(), $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .sort({ sortOrder: 1, createdAt: -1 })
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
 * GET /api/admin/products/:id
 */
async function getAdminProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categoryId", "name slug")
      .populate("addOnIds", "name pricePaise image")
      .lean();

    if (!product) {
      throw new AppError(`Product '${req.params.id}' not found`, 404);
    }

    return res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/products
 */
async function createAdminProduct(req, res, next) {
  try {
    const validated = productInputSchema.parse(req.body);
    validated.slug = validated.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    const existing = await Product.findOne({ slug: validated.slug });
    if (existing) {
      throw new AppError(`Product slug '${validated.slug}' already exists`, 409);
    }

    const product = await Product.create(validated);

    await recordAudit({
      actorId: req.admin?.id,
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product._id,
      before: null,
      after: product.toObject(),
      ip: req.ip,
    });

    return res.status(201).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/products/:id
 */
async function updateAdminProduct(req, res, next) {
  try {
    const validated = productInputSchema.partial().parse(req.body);
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError(`Product '${req.params.id}' not found`, 404);
    }

    if (validated.slug) {
      validated.slug = validated.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
      const existing = await Product.findOne({ slug: validated.slug, _id: { $ne: product._id } });
      if (existing) {
        throw new AppError(`Slug '${validated.slug}' already in use`, 409);
      }
    }

    const before = product.toObject();
    Object.assign(product, validated);
    await product.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: product._id,
      before,
      after: product.toObject(),
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/products/:id (Soft delete)
 * Owner only.
 */
async function deleteAdminProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError(`Product '${req.params.id}' not found`, 404);
    }

    product.deletedAt = new Date();
    await product.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "PRODUCT_SOFT_DELETED",
      entity: "Product",
      entityId: product._id,
      before: { deletedAt: null },
      after: { deletedAt: product.deletedAt },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: "Product soft deleted",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/products/:id/restore (Undo soft delete)
 */
async function restoreAdminProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError(`Product '${req.params.id}' not found`, 404);
    }

    const prevDeletedAt = product.deletedAt;
    product.deletedAt = null;
    await product.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "PRODUCT_RESTORED",
      entity: "Product",
      entityId: product._id,
      before: { deletedAt: prevDeletedAt },
      after: { deletedAt: null },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: "Product restored successfully",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/products/:id/duplicate
 */
async function duplicateAdminProduct(req, res, next) {
  try {
    const source = await Product.findById(req.params.id).lean();
    if (!source) {
      throw new AppError(`Product '${req.params.id}' not found`, 404);
    }

    delete source._id;
    delete source.createdAt;
    delete source.updatedAt;
    source.title = `${source.title} (Copy)`;
    source.slug = `${source.slug}-copy-${Date.now().toString().slice(-4)}`;
    source.isActive = false; // Start duplicate as draft
    source.deletedAt = null;

    const duplicate = await Product.create(source);

    await recordAudit({
      actorId: req.admin?.id,
      action: "PRODUCT_DUPLICATED",
      entity: "Product",
      entityId: duplicate._id,
      before: { sourceId: req.params.id },
      after: duplicate.toObject(),
      ip: req.ip,
    });

    return res.status(201).json({
      status: "success",
      data: { product: duplicate },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/products/bulk-status
 */
async function bulkUpdateProductStatus(req, res, next) {
  try {
    const { ids, isActive } = z
      .object({
        ids: z.array(z.string()).min(1),
        isActive: z.boolean(),
      })
      .parse(req.body);

    await Product.updateMany({ _id: { $in: ids } }, { $set: { isActive } });

    await recordAudit({
      actorId: req.admin?.id,
      action: "PRODUCTS_BULK_STATUS_UPDATED",
      entity: "Product",
      entityId: null,
      before: null,
      after: { ids, isActive },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: `Updated status to ${isActive ? "active" : "inactive"} for ${ids.length} products`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/uploads/signature
 * Generates signed Cloudinary upload params.
 */
async function getUploadSignature(req, res, next) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.body.folder || "decorjoy/products";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "decorjoy_mock_cloudinary_secret";
    const apiKey = process.env.CLOUDINARY_API_KEY || "mock_key";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "decorjoy";

    // Parameters to sign in alphabetical order
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return res.status(200).json({
      status: "success",
      data: {
        timestamp,
        signature,
        apiKey,
        cloudName,
        folder,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ================= CATEGORIES ADMIN =================
async function createCategory(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      image: z.string().optional().default(""),
      sortOrder: z.number().int().default(0),
    });
    const validated = schema.parse(req.body);
    validated.slug = validated.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    const category = await Category.create(validated);
    return res.status(201).json({ status: "success", data: { category } });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ status: "success", data: { category } });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new AppError("Category not found", 404);
    category.deletedAt = new Date();
    await category.save();
    return res.status(200).json({ status: "success", message: "Category deleted", data: { category } });
  } catch (error) {
    next(error);
  }
}

async function restoreCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true });
    return res.status(200).json({ status: "success", data: { category } });
  } catch (error) {
    next(error);
  }
}

// ================= ADDONS ADMIN =================
async function createAddOn(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      pricePaise: z.number().int().min(0),
      image: z.string().optional().default(""),
      isActive: z.boolean().default(true),
    });
    const validated = schema.parse(req.body);
    const addOn = await AddOn.create(validated);
    return res.status(201).json({ status: "success", data: { addOn } });
  } catch (error) {
    next(error);
  }
}

async function updateAddOn(req, res, next) {
  try {
    const addOn = await AddOn.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ status: "success", data: { addOn } });
  } catch (error) {
    next(error);
  }
}

async function deleteAddOn(req, res, next) {
  try {
    const addOn = await AddOn.findById(req.params.id);
    if (!addOn) throw new AppError("AddOn not found", 404);
    addOn.deletedAt = new Date();
    await addOn.save();
    return res.status(200).json({ status: "success", message: "AddOn deleted", data: { addOn } });
  } catch (error) {
    next(error);
  }
}

async function restoreAddOn(req, res, next) {
  try {
    const addOn = await AddOn.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true });
    return res.status(200).json({ status: "success", data: { addOn } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  restoreAdminProduct,
  duplicateAdminProduct,
  bulkUpdateProductStatus,
  getUploadSignature,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  restoreAddOn,
};
