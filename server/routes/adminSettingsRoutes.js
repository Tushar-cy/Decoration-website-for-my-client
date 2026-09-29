const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getSettings,
  updateSettings,
} = require("../controllers/adminSettingsController");

const router = express.Router();

router.use(protect);

// GET /api/admin/settings
router.get("/", getSettings);

// PATCH /api/admin/settings (owner only)
router.patch("/", authorize("owner"), updateSettings);

module.exports = router;
