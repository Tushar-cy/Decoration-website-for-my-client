const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getSettings,
  updateSettings,
} = require("../controllers/adminSettingsController");

const router = express.Router();

router.use(protect);
router.use(authorize("owner"));

// GET /api/admin/settings (owner only)
router.get("/", getSettings);

// PATCH /api/admin/settings (owner only)
router.patch("/", updateSettings);

module.exports = router;
