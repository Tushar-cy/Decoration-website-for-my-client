const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDashboardStats } = require("../controllers/adminDashboardController");

const router = express.Router();

router.use(protect);

// GET /api/admin/dashboard
router.get("/", getDashboardStats);

module.exports = router;
