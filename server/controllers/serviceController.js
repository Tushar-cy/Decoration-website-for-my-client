const Service = require("../models/Service");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Helper to project only public fields
const serviceProjection = "_id title description category startingPrice image createdAt";

// @desc    Get all services (Paginated)
// @route   GET /api/services
// @access  Public
const getServices = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
  const skip = (page - 1) * limit;

  const { category } = req.query;
  const filter = category && category !== "All" ? { category } : {};

  const [services, total] = await Promise.all([
    Service.find(filter)
      .select(serviceProjection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Service.countDocuments(filter),
  ]);

  res.json({
    data: services,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id)
    .select(serviceProjection)
    .lean();

  if (!service) {
    return next(new AppError("Service not found", 404));
  }
  res.json(service);
});

// @desc    Create a service
// @route   POST /api/services
// @access  Private (Admin)
const createService = asyncHandler(async (req, res, next) => {
  const { title, description, category, startingPrice, image } = req.body;

  const service = new Service({
    title,
    description,
    category,
    startingPrice: Number(startingPrice),
    image,
  });

  const savedService = await service.save();
  res.status(201).json({
    message: "Service created successfully",
    service: {
      _id: savedService._id,
      title: savedService.title,
      description: savedService.description,
      category: savedService.category,
      startingPrice: savedService.startingPrice,
      image: savedService.image,
    },
  });
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (Admin)
const updateService = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return next(new AppError("Service not found", 404));
  }

  const { title, description, category, startingPrice, image } = req.body;

  if (title !== undefined) service.title = title;
  if (description !== undefined) service.description = description;
  if (category !== undefined) service.category = category;
  if (startingPrice !== undefined) service.startingPrice = Number(startingPrice);
  if (image !== undefined) service.image = image;

  const updatedService = await service.save();
  res.json({
    message: "Service updated successfully",
    service: {
      _id: updatedService._id,
      title: updatedService.title,
      description: updatedService.description,
      category: updatedService.category,
      startingPrice: updatedService.startingPrice,
      image: updatedService.image,
    },
  });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
const deleteService = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return next(new AppError("Service not found", 404));
  }

  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: "Service removed successfully" });
});

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
