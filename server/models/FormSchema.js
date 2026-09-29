const mongoose = require("mongoose");

const fieldOptionSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const showIfSchema = new mongoose.Schema(
  {
    fieldId: {
      type: String,
      required: true,
      trim: true,
    },
    equals: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const formFieldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Field id is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "number",
        "select",
        "multiselect",
        "radio",
        "checkbox",
        "date",
        "phone",
        "email",
        "color",
      ],
      required: [true, "Field type is required"],
    },
    label: {
      type: String,
      required: [true, "Field label is required"],
      trim: true,
    },
    helpText: {
      type: String,
      default: "",
      trim: true,
    },
    placeholder: {
      type: String,
      default: "",
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [fieldOptionSchema],
      default: [],
    },
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
    pattern: {
      type: String,
      default: null,
    },
    showIf: {
      type: showIfSchema,
      default: null,
    },
    group: {
      type: String,
      default: "General",
      trim: true,
    },
  },
  { _id: false }
);

const formSchemaDefinition = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Purpose form key is required (e.g. 'birthday')"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Purpose title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    successMessage: {
      type: String,
      default:
        "Thank you! Our decor styling team will contact you within 30 minutes with tailored concepts and pricing.",
      trim: true,
    },
    notifyEmails: {
      type: [String],
      default: ["decorjoygurgaon@gmail.com"],
    },
    fields: {
      type: [formFieldSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

// Method to bump schema version on save
formSchemaDefinition.methods.bumpVersion = function () {
  this.version = (this.version || 1) + 1;
};

module.exports = mongoose.model("FormSchema", formSchemaDefinition);
