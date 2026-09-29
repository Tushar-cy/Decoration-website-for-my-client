const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderDetails,
  refundOrder,
  exportOrdersCsv,
} = require("../controllers/adminOrderController");

const router = express.Router();

// Apply admin authentication to all order admin routes
router.use(protect);

// GET /api/admin/orders/export.csv
router.get("/export.csv", exportOrdersCsv);

// GET /api/admin/orders
router.get("/", getOrders);

// GET /api/admin/orders/:id
router.get("/:id", getOrderById);

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", updateOrderStatus);

// PATCH /api/admin/orders/:id (notes and rescheduling)
router.patch("/:id", updateOrderDetails);

// POST /api/admin/orders/:id/refund (owner only)
router.post("/:id/refund", authorize("owner"), refundOrder);

module.exports = router;
