const mongoose = require("mongoose");

const slotBookingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    slotKey: {
      type: String,
      required: [true, "Slot key is required"],
      trim: true,
    },
    booked: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

// Compound Unique Index: prevents duplicate bookings for the same slot on the same date
slotBookingSchema.index({ date: 1, slotKey: 1 }, { unique: true });

module.exports = mongoose.model("SlotBooking", slotBookingSchema);
