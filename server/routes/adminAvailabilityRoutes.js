const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMonthAvailability,
  toggleBlockDate,
  updateSlotCapacity,
} = require("../controllers/adminAvailabilityController");

const router = express.Router();

router.use(protect);

// GET /api/admin/availability/month
router.get("/month", getMonthAvailability);

// POST /api/admin/availability/toggle-block
router.post("/toggle-block", toggleBlockDate);

// PATCH /api/admin/availability/slot-capacity
router.patch("/slot-capacity", updateSlotCapacity);

module.exports = router;
