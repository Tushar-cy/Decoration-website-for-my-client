const express = require("express");
const {
  getActivePurposes,
  getFormByKey,
  submitPurposeForm,
} = require("../controllers/purposeFormController");
const { submissionLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/forms (active purposes for chooser)
router.get("/", getActivePurposes);

// GET /api/forms/:key (schema for specific purpose)
router.get("/:key", getFormByKey);

// POST /api/forms/:key/submissions (submit purpose form)
router.post("/:key/submissions", submissionLimiter, submitPurposeForm);

module.exports = router;
