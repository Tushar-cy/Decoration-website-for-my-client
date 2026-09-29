const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  updateInquiry,
  deleteInquiry,
} = require("../controllers/inquiryController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { inquiryLimiter } = require("../middleware/rateLimiter");
const {
  validateBody,
  createInquirySchema,
  updateInquirySchema,
} = require("../validators/schemas");

// Public route to submit an inquiry - Rate limited to 5/min, validated schema
router.post("/", inquiryLimiter, validateBody(createInquirySchema), createInquiry);

// Protected admin routes to view, update, or remove inquiries
router.get("/", protect, authorize("owner", "staff"), getInquiries);
router.put("/:id", protect, authorize("owner", "staff"), validateBody(updateInquirySchema), updateInquiry);
router.delete("/:id", protect, authorize("owner"), deleteInquiry);

module.exports = router;
