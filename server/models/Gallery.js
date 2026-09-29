const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Gallery item title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Birthday", "Anniversary", "Baby Shower", "Proposal", "Corporate", "Other"],
      default: "Other",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    publicId: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

gallerySchema.index({ category: 1, isActive: 1, sortOrder: 1 });
gallerySchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);
