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
      enum: ["Birthday", "Anniversary", "Baby Shower", "Proposal", "Other"],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gallery", gallerySchema);
