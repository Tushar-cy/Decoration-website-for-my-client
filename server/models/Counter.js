const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

// Atomically generates sequential order numbers in the format DJ-YYYY-000123
counterSchema.statics.generateOrderNumber = async function (
  year = new Date().getFullYear()
) {
  const counterKey = `orders_${year}`;

  const counter = await this.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const paddedSeq = String(counter.seq).padStart(6, "0");
  return `DJ-${year}-${paddedSeq}`;
};

module.exports = mongoose.model("Counter", counterSchema);
