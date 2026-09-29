const express = require("express");
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validateBody,
  createServiceSchema,
  updateServiceSchema,
} = require("../validators/schemas");

// Public routes
router.get("/", getServices);
router.get("/:id", getServiceById);

// Protected admin routes
router.post(
  "/",
  protect,
  authorize("owner", "staff"),
  validateBody(createServiceSchema),
  createService
);
router.put(
  "/:id",
  protect,
  authorize("owner", "staff"),
  validateBody(updateServiceSchema),
  updateService
);
router.delete("/:id", protect, authorize("owner"), deleteService);

module.exports = router;
