const express = require("express");
const router = express.Router();
const {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validateBody,
  createTestimonialSchema,
  updateTestimonialSchema,
} = require("../validators/schemas");

// Public route
router.get("/", getTestimonials);

// Protected admin routes
router.post(
  "/",
  protect,
  authorize("owner", "staff"),
  validateBody(createTestimonialSchema),
  createTestimonial
);
router.put(
  "/:id",
  protect,
  authorize("owner", "staff"),
  validateBody(updateTestimonialSchema),
  updateTestimonial
);
router.delete("/:id", protect, authorize("owner"), deleteTestimonial);

module.exports = router;
