const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/adminCouponController");

const router = express.Router();

router.use(protect);

// GET /api/admin/coupons
router.get("/", getCoupons);

// POST /api/admin/coupons
router.post("/", createCoupon);

// GET /api/admin/coupons/:id
router.get("/:id", getCouponById);

// PUT /api/admin/coupons/:id
router.put("/:id", updateCoupon);

// DELETE /api/admin/coupons/:id
router.delete("/:id", deleteCoupon);

module.exports = router;
