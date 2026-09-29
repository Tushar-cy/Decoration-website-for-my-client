const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
    },
    category: {
      type: String,
      required: [true, "Service category is required"],
      enum: ["Birthdays", "Anniversaries", "Baby Showers", "Proposals", "Special Celebrations"],
      default: "Birthdays",
    },
    startingPrice: {
      type: Number,
      required: [true, "Starting price is required"],
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

module.exports = mongoose.model("Service", serviceSchema);
