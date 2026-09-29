const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      trim: true,
    },
    eventDate: {
      type: String,
      required: [true, "Event date is required"],
    },
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "completed"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
