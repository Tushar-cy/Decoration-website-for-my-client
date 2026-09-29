const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  addSubmissionNote,
  assignSubmission,
  convertSubmissionToOrder,
  exportSubmissionsCsv,
} = require("../controllers/adminSubmissionController");

const router = express.Router();

router.use(protect);

// GET /api/admin/submissions/export.csv
router.get("/export.csv", exportSubmissionsCsv);

// GET /api/admin/submissions
router.get("/", getSubmissions);

// GET /api/admin/submissions/:id
router.get("/:id", getSubmissionById);

// PATCH /api/admin/submissions/:id/status
router.patch("/:id/status", updateSubmissionStatus);

// POST /api/admin/submissions/:id/notes
router.post("/:id/notes", addSubmissionNote);

// PATCH /api/admin/submissions/:id/assign
router.patch("/:id/assign", assignSubmission);

// POST /api/admin/submissions/:id/convert
router.post("/:id/convert", convertSubmissionToOrder);

module.exports = router;
