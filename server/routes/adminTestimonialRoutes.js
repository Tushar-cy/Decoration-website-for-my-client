const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  listAdminTestimonials,
  createAdminTestimonial,
  updateAdminTestimonial,
  toggleTestimonialActive,
  deleteAdminTestimonial,
} = require("../controllers/adminTestimonialController");

// All routes require authentication
router.use(protect);

// List (admin sees all including inactive)
router.get("/", listAdminTestimonials);

// Create (staff+)
router.post("/", authorize("owner", "staff"), createAdminTestimonial);

// Update (staff+)
router.put("/:id", authorize("owner", "staff"), updateAdminTestimonial);

// Toggle active (staff+)
router.patch("/:id/toggle-active", authorize("owner", "staff"), toggleTestimonialActive);

// Delete (owner only)
router.delete("/:id", authorize("owner"), deleteAdminTestimonial);

module.exports = router;
