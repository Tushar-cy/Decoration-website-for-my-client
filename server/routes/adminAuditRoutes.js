const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getAuditLogs } = require("../controllers/adminAuditController");

const router = express.Router();

router.use(protect);

// GET /api/admin/audit-logs
router.get("/", getAuditLogs);

module.exports = router;
