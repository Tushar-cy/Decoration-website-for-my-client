const Gallery = require("../models/Gallery");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const cache = require("../utils/cache");

const galleryProjection = "_id title category description image createdAt";

// @desc    Get all gallery items (Paginated)
// @route   GET /api/gallery
// @access  Public
const getGallery = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
  const skip = (page - 1) * limit;

  const { category } = req.query;
  const filter = category && category !== "All" ? { category } : {};

  const cacheKey = cache.buildCacheKey("gallery", req.query);

  const result = await cache.wrap(
    cacheKey,
    600, // 10 minutes
    async () => {
      const [galleryItems, total] = await Promise.all([
        Gallery.find(filter)
          .select(galleryProjection)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Gallery.countDocuments(filter),
      ]);

      return {
        data: galleryItems,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    },
    { tags: ["gallery"] }
  );

  res.json(result);
});

// @desc    Get single gallery item by ID
// @route   GET /api/gallery/:id
// @access  Public
const getGalleryById = asyncHandler(async (req, res, next) => {
  const cacheKey = cache.buildCacheKey("gallery_item", { id: req.params.id });

  const item = await cache.wrap(
    cacheKey,
    600,
    async () => {
      const doc = await Gallery.findById(req.params.id)
        .select(galleryProjection)
        .lean();

      if (!doc) {
        throw new AppError("Gallery item not found", 404);
      }
      return doc;
    },
    { tags: ["gallery"] }
  );

  res.json(item);
});

// @desc    Create a gallery item
// @route   POST /api/gallery
// @access  Private (Admin)
const createGallery = asyncHandler(async (req, res, next) => {
  const { title, category, description, image } = req.body;

  const item = new Gallery({
    title,
    category,
    description: description || "",
    image,
  });

  const savedItem = await item.save();

  // Invalidate cache
  await cache.invalidateTags(["gallery"]);

  res.status(201).json({
    message: "Gallery item created successfully",
    item: {
      _id: savedItem._id,
      title: savedItem.title,
      category: savedItem.category,
      description: savedItem.description,
      image: savedItem.image,
    },
  });
});

// @desc    Update a gallery item
// @route   PUT /api/gallery/:id
// @access  Private (Admin)
const updateGallery = asyncHandler(async (req, res, next) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) {
    return next(new AppError("Gallery item not found", 404));
  }

  const { title, category, description, image } = req.body;

  if (title !== undefined) item.title = title;
  if (category !== undefined) item.category = category;
  if (description !== undefined) item.description = description;
  if (image !== undefined) item.image = image;

  const updatedItem = await item.save();

  // Invalidate cache
  await cache.invalidateTags(["gallery"]);

  res.json({
    message: "Gallery item updated successfully",
    item: {
      _id: updatedItem._id,
      title: updatedItem.title,
      category: updatedItem.category,
      description: updatedItem.description,
      image: updatedItem.image,
    },
  });
});

// @desc    Delete a gallery item
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
const deleteGallery = asyncHandler(async (req, res, next) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) {
    return next(new AppError("Gallery item not found", 404));
  }

  await Gallery.findByIdAndDelete(req.params.id);

  // Invalidate cache
  await cache.invalidateTags(["gallery"]);

  res.json({ message: "Gallery item removed successfully" });
});

module.exports = {
  getGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
};
