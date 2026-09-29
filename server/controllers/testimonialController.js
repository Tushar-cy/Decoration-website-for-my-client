const Testimonial = require("../models/Testimonial");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const testimonialProjection = "_id name location eventType review rating createdAt";

// @desc    Get all testimonials (Paginated)
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
  const skip = (page - 1) * limit;

  const [testimonials, total] = await Promise.all([
    Testimonial.find()
      .select(testimonialProjection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Testimonial.countDocuments(),
  ]);

  res.json({
    data: testimonials,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Create a testimonial
// @route   POST /api/testimonials
// @access  Private (Admin)
const createTestimonial = asyncHandler(async (req, res, next) => {
  const { name, location, eventType, review, rating } = req.body;

  const testimonial = new Testimonial({
    name,
    location: location || "Gurgaon",
    eventType: eventType || "Celebration",
    review,
    rating: rating ? Number(rating) : 5,
  });

  const savedTestimonial = await testimonial.save();
  res.status(201).json({
    message: "Testimonial created successfully",
    testimonial: {
      _id: savedTestimonial._id,
      name: savedTestimonial.name,
      location: savedTestimonial.location,
      eventType: savedTestimonial.eventType,
      review: savedTestimonial.review,
      rating: savedTestimonial.rating,
    },
  });
});

// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
const updateTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return next(new AppError("Testimonial not found", 404));
  }

  const { name, location, eventType, review, rating } = req.body;

  if (name !== undefined) testimonial.name = name;
  if (location !== undefined) testimonial.location = location;
  if (eventType !== undefined) testimonial.eventType = eventType;
  if (review !== undefined) testimonial.review = review;
  if (rating !== undefined) testimonial.rating = Number(rating);

  const updatedTestimonial = await testimonial.save();
  res.json({
    message: "Testimonial updated successfully",
    testimonial: {
      _id: updatedTestimonial._id,
      name: updatedTestimonial.name,
      location: updatedTestimonial.location,
      eventType: updatedTestimonial.eventType,
      review: updatedTestimonial.review,
      rating: updatedTestimonial.rating,
    },
  });
});

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
const deleteTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return next(new AppError("Testimonial not found", 404));
  }

  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ message: "Testimonial deleted successfully" });
});

module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
