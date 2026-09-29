const { z } = require("zod");
const Gallery = require("../models/Gallery");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const cache = require("../utils/cache");
const { recordAudit } = require("../services/auditService");

const WHITELISTED_FIELDS = "_id title category description image isActive isFeatured sortOrder createdAt";

const createGallerySchema = z.object({
  title: z.string().min(2).max(120),
  category: z.enum(["Birthday", "Anniversary", "Baby Shower", "Proposal", "Corporate", "Other"]),
  description: z.string().max(500).optional().default(""),
  image: z.string().url(),
  publicId: z.string().optional().default(""),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

const updateGallerySchema = createGallerySchema.partial();

/**
 * GET /api/admin/gallery
 * All gallery items for admin (including inactive)
 */
const listAdminGallery = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
  if (req.query.active === "true") filter.isActive = true;
  if (req.query.active === "false") filter.isActive = false;
  if (req.query.featured === "true") filter.isFeatured = true;

  const [items, total] = await Promise.all([
    Gallery.find(filter)
      .select(WHITELISTED_FIELDS)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Gallery.countDocuments(filter),
  ]);

  res.json({
    status: "success",
    data: {
      items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

/**
 * POST /api/admin/gallery
 */
const createAdminGallery = asyncHandler(async (req, res) => {
  const parsed = createGallerySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", error: { message: parsed.error.errors[0].message } });
  }

  const item = await Gallery.create(parsed.data);
  await cache.invalidateTags(["gallery"]);
  await recordAudit(req.user._id, "gallery.create", { id: item._id, title: item.title });

  res.status(201).json({
    status: "success",
    data: { item: pickFields(item) },
  });
});

/**
 * PUT /api/admin/gallery/:id
 */
const updateAdminGallery = asyncHandler(async (req, res) => {
  const parsed = updateGallerySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", error: { message: parsed.error.errors[0].message } });
  }

  const item = await Gallery.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ status: "error", error: { message: "Gallery item not found" } });

  await cache.invalidateTags(["gallery"]);
  await recordAudit(req.user._id, "gallery.update", { id: item._id });

  res.json({ status: "success", data: { item: pickFields(item) } });
});

/**
 * PATCH /api/admin/gallery/:id/toggle-active
 */
const toggleGalleryActive = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ status: "error", error: { message: "Gallery item not found" } });

  item.isActive = !item.isActive;
  await item.save();
  await cache.invalidateTags(["gallery"]);

  res.json({ status: "success", data: { id: item._id, isActive: item.isActive } });
});

/**
 * PATCH /api/admin/gallery/:id/toggle-featured
 */
const toggleGalleryFeatured = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ status: "error", error: { message: "Gallery item not found" } });

  item.isFeatured = !item.isFeatured;
  await item.save();
  await cache.invalidateTags(["gallery"]);

  res.json({ status: "success", data: { id: item._id, isFeatured: item.isFeatured } });
});

/**
 * DELETE /api/admin/gallery/:id  (owner only — hard delete)
 */
const deleteAdminGallery = asyncHandler(async (req, res) => {
  const item = await Gallery.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ status: "error", error: { message: "Gallery item not found" } });

  await cache.invalidateTags(["gallery"]);
  await recordAudit(req.user._id, "gallery.delete", { id: req.params.id, title: item.title });

  res.json({ status: "success", message: "Gallery item deleted" });
});

/**
 * POST /api/admin/gallery/bulk-upload
 * Accepts array of gallery items
 */
const bulkUploadGallery = asyncHandler(async (req, res) => {
  const schema = z.array(createGallerySchema).min(1).max(50);
  const parsed = schema.safeParse(req.body.items);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", error: { message: parsed.error.errors[0].message } });
  }

  const items = await Gallery.insertMany(parsed.data);
  await cache.invalidateTags(["gallery"]);
  await recordAudit(req.user._id, "gallery.bulkUpload", { count: items.length });

  res.status(201).json({
    status: "success",
    data: { created: items.length },
  });
});

function pickFields(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id,
    title: obj.title,
    category: obj.category,
    description: obj.description,
    image: obj.image,
    publicId: obj.publicId,
    isActive: obj.isActive,
    isFeatured: obj.isFeatured,
    sortOrder: obj.sortOrder,
    createdAt: obj.createdAt,
  };
}

module.exports = {
  listAdminGallery,
  createAdminGallery,
  updateAdminGallery,
  toggleGalleryActive,
  toggleGalleryFeatured,
  deleteAdminGallery,
  bulkUploadGallery,
};
