const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  listAdminGallery,
  createAdminGallery,
  updateAdminGallery,
  toggleGalleryActive,
  toggleGalleryFeatured,
  deleteAdminGallery,
  bulkUploadGallery,
} = require("../controllers/adminGalleryController");

// All routes require authentication
router.use(protect);

// List (admin sees all including inactive)
router.get("/", listAdminGallery);

// Bulk upload (staff+)
router.post("/bulk", authorize("owner", "staff"), bulkUploadGallery);

// Create (staff+)
router.post("/", authorize("owner", "staff"), createAdminGallery);

// Update (staff+)
router.put("/:id", authorize("owner", "staff"), updateAdminGallery);

// Toggle active (staff+)
router.patch("/:id/toggle-active", authorize("owner", "staff"), toggleGalleryActive);

// Toggle featured (staff+)
router.patch("/:id/toggle-featured", authorize("owner", "staff"), toggleGalleryFeatured);

// Delete (owner only)
router.delete("/:id", authorize("owner"), deleteAdminGallery);

module.exports = router;
