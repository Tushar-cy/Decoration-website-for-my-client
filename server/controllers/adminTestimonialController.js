const { z } = require("zod");
const Testimonial = require("../models/Testimonial");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const cache = require("../utils/cache");
const { recordAudit } = require("../services/auditService");

const WHITELISTED_FIELDS = "_id name location eventType review rating isActive sortOrder createdAt";

const testimonialInputSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().max(100).optional().default("Gurgaon"),
  eventType: z.string().max(100).optional().default("Celebration"),
  review: z.string().min(10).max(1000),
  rating: z.number().int().min(1).max(5).optional().default(5),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

/**
 * GET /api/admin/testimonials
 * All testimonials for admin (including inactive)
 */
const listAdminTestimonials = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.active === "true") filter.isActive = true;
  if (req.query.active === "false") filter.isActive = false;

  const [items, total] = await Promise.all([
    Testimonial.find(filter)
      .select(WHITELISTED_FIELDS)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Testimonial.countDocuments(filter),
  ]);

  res.json({
    status: "success",
    data: {
      testimonials: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

/**
 * POST /api/admin/testimonials
 */
const createAdminTestimonial = asyncHandler(async (req, res) => {
  const parsed = testimonialInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", error: { message: parsed.error.errors[0].message } });
  }

  const item = await Testimonial.create(parsed.data);
  await cache.invalidateTags(["testimonials"]);
  await recordAudit(req.user._id, "testimonial.create", { id: item._id, name: item.name });

  res.status(201).json({ status: "success", data: { testimonial: pickFields(item) } });
});

/**
 * PUT /api/admin/testimonials/:id
 */
const updateAdminTestimonial = asyncHandler(async (req, res) => {
  const parsed = testimonialInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: "error", error: { message: parsed.error.errors[0].message } });
  }

  const item = await Testimonial.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ status: "error", error: { message: "Testimonial not found" } });

  await cache.invalidateTags(["testimonials"]);
  await recordAudit(req.user._id, "testimonial.update", { id: item._id });

  res.json({ status: "success", data: { testimonial: pickFields(item) } });
});

/**
 * PATCH /api/admin/testimonials/:id/toggle-active
 */
const toggleTestimonialActive = asyncHandler(async (req, res) => {
  const item = await Testimonial.findById(req.params.id);
  if (!item) return res.status(404).json({ status: "error", error: { message: "Testimonial not found" } });

  item.isActive = !item.isActive;
  await item.save();
  await cache.invalidateTags(["testimonials"]);

  res.json({ status: "success", data: { id: item._id, isActive: item.isActive } });
});

/**
 * DELETE /api/admin/testimonials/:id (owner only)
 */
const deleteAdminTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ status: "error", error: { message: "Testimonial not found" } });

  await cache.invalidateTags(["testimonials"]);
  await recordAudit(req.user._id, "testimonial.delete", { id: req.params.id, name: item.name });

  res.json({ status: "success", message: "Testimonial deleted" });
});

function pickFields(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id,
    name: obj.name,
    location: obj.location,
    eventType: obj.eventType,
    review: obj.review,
    rating: obj.rating,
    isActive: obj.isActive,
    sortOrder: obj.sortOrder,
    createdAt: obj.createdAt,
  };
}

module.exports = {
  listAdminTestimonials,
  createAdminTestimonial,
  updateAdminTestimonial,
  toggleTestimonialActive,
  deleteAdminTestimonial,
};
