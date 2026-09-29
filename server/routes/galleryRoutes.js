const express = require("express");
const router = express.Router();
const {
  getGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
} = require("../controllers/galleryController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validateBody,
  createGallerySchema,
  updateGallerySchema,
} = require("../validators/schemas");

// Public routes
router.get("/", getGallery);
router.get("/:id", getGalleryById);

// Protected admin routes
router.post(
  "/",
  protect,
  authorize("owner", "staff"),
  validateBody(createGallerySchema),
  createGallery
);
router.put(
  "/:id",
  protect,
  authorize("owner", "staff"),
  validateBody(updateGallerySchema),
  updateGallery
);
router.delete("/:id", protect, authorize("owner"), deleteGallery);

module.exports = router;
