const mongoose = require("mongoose");

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "AddOn name is required"],
      trim: true,
    },
    pricePaise: {
      type: Number,
      required: [true, "Price in paise is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer paise value",
      },
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
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

addOnSchema.index({ isActive: 1 });

module.exports = mongoose.model("AddOn", addOnSchema);
