const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getAllForms,
  getFormSchema,
  createFormSchema,
  saveFormSchema,
  toggleFormStatus,
} = require("../controllers/adminFormBuilderController");

const router = express.Router();

router.use(protect);

// GET /api/admin/forms
router.get("/", getAllForms);

// GET /api/admin/forms/:key
router.get("/:key", getFormSchema);

// POST /api/admin/forms
router.post("/", createFormSchema);

// PUT /api/admin/forms/:key (version bump on save)
router.put("/:key", saveFormSchema);

// PATCH /api/admin/forms/:key/status
router.patch("/:key/status", toggleFormStatus);

module.exports = router;
