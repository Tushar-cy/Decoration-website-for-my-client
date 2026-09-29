const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Decor Joy Admin",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "staff"],
      default: "owner",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLogins: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check if account is currently locked
adminSchema.methods.isLocked = function () {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
};

module.exports = mongoose.model("Admin", adminSchema);
