const mongoose = require("mongoose");

const variantOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    priceDeltaPaise: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} must be an integer paise amount",
      },
    },
    colorCode: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    options: [variantOptionSchema],
  },
  { _id: false }
);

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
    },
    alt: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    basePricePaise: {
      type: Number,
      required: [true, "Base price in paise is required"],
      min: [0, "Base price cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} must be an integer paise value",
      },
    },
    compareAtPricePaise: {
      type: Number,
      default: null,
      validate: {
        validator: (v) => v === null || Number.isInteger(v),
        message: "{VALUE} must be an integer paise value or null",
      },
    },
    images: [productImageSchema],
    variants: [variantSchema],
    includedItems: {
      type: [String],
      default: [],
    },
    addOnIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddOn",
      },
    ],
    setupMinutes: {
      type: Number,
      default: 90,
      min: 0,
    },
    minLeadHours: {
      type: Number,
      default: 24,
      min: 0,
    },
    badge: {
      type: String,
      default: "",
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    seo: {
      title: {
        type: String,
        default: "",
        trim: true,
      },
      description: {
        type: String,
        default: "",
        trim: true,
      },
    },
    ratingAvg: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

// Indexes
productSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });
productSchema.index({ title: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
