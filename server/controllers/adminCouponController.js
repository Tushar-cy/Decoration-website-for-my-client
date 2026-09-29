const { z } = require("zod");
const Coupon = require("../models/Coupon");
const { recordAudit } = require("../services/auditService");
const AppError = require("../utils/AppError");

const couponInputSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().min(1, "Value must be positive"),
  minOrderPaise: z.number().int().min(0).default(0),
  maxDiscountPaise: z.number().int().min(0).nullable().optional(),
  validFrom: z.string().optional(),
  validTo: z.string({ error: "validTo expiration date is required" }),
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/coupons
 */
async function getCoupons(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        coupons,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/coupons
 */
async function createCoupon(req, res, next) {
  try {
    const validated = couponInputSchema.parse(req.body);

    const existing = await Coupon.findOne({ code: validated.code });
    if (existing) {
      throw new AppError(`Coupon with code '${validated.code}' already exists`, 409);
    }

    const coupon = await Coupon.create({
      code: validated.code,
      type: validated.type,
      value: validated.value,
      minOrderPaise: validated.minOrderPaise,
      maxDiscountPaise: validated.maxDiscountPaise ?? null,
      validFrom: validated.validFrom ? new Date(validated.validFrom) : new Date(),
      validTo: new Date(validated.validTo),
      usageLimit: validated.usageLimit ?? null,
      isActive: validated.isActive,
    });

    await recordAudit({
      actorId: req.admin?.id,
      action: "COUPON_CREATED",
      entity: "Coupon",
      entityId: coupon._id,
      before: null,
      after: coupon.toObject(),
      ip: req.ip,
    });

    return res.status(201).json({
      status: "success",
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/coupons/:id
 */
async function getCouponById(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id).lean();
    if (!coupon) {
      throw new AppError(`Coupon with ID '${req.params.id}' not found`, 404);
    }
    return res.status(200).json({
      status: "success",
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/coupons/:id
 */
async function updateCoupon(req, res, next) {
  try {
    const validated = couponInputSchema.partial().parse(req.body);
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      throw new AppError(`Coupon with ID '${req.params.id}' not found`, 404);
    }

    const before = coupon.toObject();

    if (validated.code && validated.code !== coupon.code) {
      const existing = await Coupon.findOne({ code: validated.code });
      if (existing) {
        throw new AppError(`Coupon code '${validated.code}' already in use`, 409);
      }
      coupon.code = validated.code;
    }

    if (validated.type) coupon.type = validated.type;
    if (validated.value !== undefined) coupon.value = validated.value;
    if (validated.minOrderPaise !== undefined) coupon.minOrderPaise = validated.minOrderPaise;
    if (validated.maxDiscountPaise !== undefined) coupon.maxDiscountPaise = validated.maxDiscountPaise;
    if (validated.validFrom) coupon.validFrom = new Date(validated.validFrom);
    if (validated.validTo) coupon.validTo = new Date(validated.validTo);
    if (validated.usageLimit !== undefined) coupon.usageLimit = validated.usageLimit;
    if (validated.isActive !== undefined) coupon.isActive = validated.isActive;

    await coupon.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "COUPON_UPDATED",
      entity: "Coupon",
      entityId: coupon._id,
      before,
      after: coupon.toObject(),
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/coupons/:id
 */
async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      throw new AppError(`Coupon with ID '${req.params.id}' not found`, 404);
    }

    const before = coupon.toObject();
    await Coupon.findByIdAndDelete(req.params.id);

    await recordAudit({
      actorId: req.admin?.id,
      action: "COUPON_DELETED",
      entity: "Coupon",
      entityId: req.params.id,
      before,
      after: null,
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};
