const mongoose = require("mongoose");
const { normalizeIndianPhone } = require("./Customer");

const answerSnapshotSchema = new mongoose.Schema(
  {
    fieldId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    group: {
      type: String,
      default: "General",
    },
  },
  { _id: false }
);

const submissionNoteSchema = new mongoose.Schema(
  {
    by: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    formKey: {
      type: String,
      required: [true, "Form key is required"],
      trim: true,
      index: true,
    },
    formVersion: {
      type: Number,
      required: [true, "Form version is required"],
      min: 1,
    },
    answers: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Submission answers object is required"],
      default: {},
    },
    answersSnapshot: {
      type: [answerSnapshotSchema],
      default: [],
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Customer phone number is required"],
      trim: true,
      set: normalizeIndianPhone,
      index: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "converted", "lost"],
      default: "new",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    notes: {
      type: [submissionNoteSchema],
      default: [],
    },
    convertedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    utm: {
      source: { type: String, default: "" },
      medium: { type: String, default: "" },
      campaign: { type: String, default: "" },
      term: { type: String, default: "" },
      content: { type: String, default: "" },
    },
    ipHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ formKey: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
