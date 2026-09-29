const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    location: {
      type: String,
      default: "Gurgaon",
      trim: true,
    },
    eventType: {
      type: String,
      default: "Celebration",
      trim: true,
    },
    review: {
      type: String,
      required: [true, "Review text is required"],
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
