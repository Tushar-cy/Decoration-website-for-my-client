const mongoose = require("mongoose");
const Counter = require("./Counter");

const orderItemAddOnSchema = new mongoose.Schema(
  {
    addOnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AddOn",
      required: true,
    },
    nameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    pricePaise: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} must be an integer paise amount",
      },
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    titleSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    variantSelections: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    unitPricePaise: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} must be an integer paise amount",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    addOns: [orderItemAddOnSchema],
  },
  { _id: true }
);

const orderAddressSchema = new mongoose.Schema(
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
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: String,
      default: "system",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
    },
    items: [orderItemSchema],
    event: {
      type: {
        type: String,
        required: true,
        trim: true,
      },
      date: {
        type: Date,
        required: true,
      },
      slotKey: {
        type: String,
        required: true,
      },
      address: {
        type: orderAddressSchema,
        required: true,
      },
      notes: {
        type: String,
        default: "",
      },
    },
    pricing: {
      subtotalPaise: {
        type: Number,
        required: true,
        validate: { validator: Number.isInteger },
      },
      discountPaise: {
        type: Number,
        default: 0,
        validate: { validator: Number.isInteger },
      },
      deliveryFeePaise: {
        type: Number,
        default: 0,
        validate: { validator: Number.isInteger },
      },
      totalPaise: {
        type: Number,
        required: true,
        validate: { validator: Number.isInteger },
      },
      advanceDuePaise: {
        type: Number,
        required: true,
        validate: { validator: Number.isInteger },
      },
    },
    coupon: {
      code: { type: String, default: null },
      discountPaise: { type: Number, default: 0 },
    },
    payment: {
      status: {
        type: String,
        enum: ["unpaid", "advance_paid", "paid", "refunded", "failed"],
        default: "unpaid",
      },
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      paidPaise: {
        type: Number,
        default: 0,
        validate: { validator: Number.isInteger },
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    statusHistory: [statusHistorySchema],
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    source: {
      type: String,
      default: "web",
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

// Indexes
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "event.date": 1 });

// Pre-validate hook to assign orderNumber atomically if not provided
orderSchema.pre("validate", async function () {
  if (!this.orderNumber) {
    const year = this.event?.date
      ? new Date(this.event.date).getFullYear()
      : new Date().getFullYear();
    this.orderNumber = await Counter.generateOrderNumber(year);
  }
});

// Static helper method directly on Order model
orderSchema.statics.generateOrderNumber = async function (year) {
  return Counter.generateOrderNumber(year);
};

module.exports = mongoose.model("Order", orderSchema);
