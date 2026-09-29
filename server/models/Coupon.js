const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percent", "flat"],
      required: [true, "Coupon type ('percent' or 'flat') is required"],
    },
    value: {
      type: Number,
      required: [true, "Coupon value is required"],
      min: [1, "Coupon value must be greater than 0"],
      validate: {
        validator: function (v) {
          if (this.type === "percent") {
            return v > 0 && v <= 100;
          }
          return Number.isInteger(v) && v > 0;
        },
        message: "Invalid coupon value for specified type",
      },
    },
    minOrderPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} must be an integer paise amount",
      },
    },
    maxDiscountPaise: {
      type: Number,
      default: null,
      validate: {
        validator: (v) => v === null || (Number.isInteger(v) && v > 0),
        message: "{VALUE} must be an integer paise amount or null",
      },
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validTo: {
      type: Date,
      required: [true, "Coupon expiration date (validTo) is required"],
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

couponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
