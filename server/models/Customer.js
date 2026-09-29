const mongoose = require("mongoose");

const normalizeIndianPhone = (rawPhone) => {
  if (!rawPhone) return "";
  const cleaned = String(rawPhone).replace(/[^\d]/g, "");

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `+91${cleaned.slice(1)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
};

const customerAddressSchema = new mongoose.Schema(
  {
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    locality: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "Gurugram",
      trim: true,
    },
    state: {
      type: String,
      default: "Haryana",
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      set: normalizeIndianPhone,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    addresses: {
      type: [customerAddressSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

module.exports = {
  Customer: mongoose.model("Customer", customerSchema),
  normalizeIndianPhone,
};
