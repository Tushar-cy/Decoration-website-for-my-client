const Inquiry = require("../models/Inquiry");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Create new inquiry / booking request
// @route   POST /api/inquiries
// @access  Public
const createInquiry = asyncHandler(async (req, res, next) => {
  const { name, phone, email, eventType, eventDate, message } = req.body;

  const inquiry = new Inquiry({
    name,
    phone,
    email: email || "",
    eventType,
    eventDate,
    message: message || "",
    status: "new",
  });

  const savedInquiry = await inquiry.save();

  // Also mirror into Submission collection for unified inbox
  try {
    const Submission = require("../models/Submission");
    await Submission.create({
      formKey: "legacy-inquiry",
      formVersion: 1,
      answers: {
        eventType,
        eventDate,
        message: message || "",
      },
      answersSnapshot: [
        { fieldId: "eventType", label: "Event Type", value: eventType, group: "General" },
        { fieldId: "eventDate", label: "Event Date", value: eventDate, group: "General" },
        { fieldId: "message", label: "Message / Requirements", value: message || "", group: "General" },
      ],
      name,
      phone,
      email: email || "",
      status: "new",
    });
  } catch (err) {
    // Non-blocking mirror
  }

  // Public response returns only { message, id }, never raw document
  res.status(201).json({
    message: "Thank you! Your inquiry has been received. We will contact you shortly.",
    id: savedInquiry._id,
  });
});

// @desc    Get all inquiries (Paginated)
// @route   GET /api/inquiries
// @access  Private (Admin)
const getInquiries = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
  const skip = (page - 1) * limit;

  const { status } = req.query;
  const filter = status && status !== "All" ? { status } : {};

  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inquiry.countDocuments(filter),
  ]);

  res.json({
    data: inquiries,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id
// @access  Private (Admin)
const updateInquiry = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return next(new AppError("Inquiry not found", 404));
  }

  inquiry.status = status;
  const updatedInquiry = await inquiry.save();

  res.json({
    message: "Inquiry updated successfully",
    inquiry: {
      _id: updatedInquiry._id,
      name: updatedInquiry.name,
      phone: updatedInquiry.phone,
      email: updatedInquiry.email,
      eventType: updatedInquiry.eventType,
      eventDate: updatedInquiry.eventDate,
      message: updatedInquiry.message,
      status: updatedInquiry.status,
      updatedAt: updatedInquiry.updatedAt,
    },
  });
});

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin)
const deleteInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return next(new AppError("Inquiry not found", 404));
  }

  await Inquiry.findByIdAndDelete(req.params.id);
  res.json({ message: "Inquiry deleted successfully" });
});

module.exports = {
  createInquiry,
  getInquiries,
  updateInquiry,
  deleteInquiry,
};
