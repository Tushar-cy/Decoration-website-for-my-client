const mongoose = require("mongoose");

const slotConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    capacityPerDay: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
    },
  },
  { _id: false }
);

const serviceablePincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryFeePaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} must be an integer paise amount",
      },
    },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    business: {
      name: {
        type: String,
        default: "Decor Joy Gurgaon",
        trim: true,
      },
      phone: {
        type: String,
        default: "+917015767715",
        trim: true,
      },
      whatsapp: {
        type: String,
        default: "+917015767715",
        trim: true,
      },
      email: {
        type: String,
        default: "decorjoygurgaon@gmail.com",
        trim: true,
      },
      address: {
        type: String,
        default: "166GF Sector 57 Gurugram, Haryana 122003",
        trim: true,
      },
      geo: {
        lat: { type: Number, default: 28.435 },
        lng: { type: Number, default: 77.086 },
      },
      openingHours: {
        type: String,
        default: "Mo-Su 08:00-22:00",
        trim: true,
      },
      googleReviewUrl: {
        type: String,
        default: "https://g.page/r/decorjoygurgaon/review",
        trim: true,
      },
    },
    slots: {
      type: [slotConfigSchema],
      default: [
        {
          key: "morning",
          label: "Morning (09:00 AM - 01:00 PM)",
          startTime: "09:00",
          endTime: "13:00",
          capacityPerDay: 5,
        },
        {
          key: "afternoon",
          label: "Afternoon (01:00 PM - 05:00 PM)",
          startTime: "13:00",
          endTime: "17:00",
          capacityPerDay: 5,
        },
        {
          key: "evening",
          label: "Evening (05:00 PM - 09:00 PM)",
          startTime: "17:00",
          endTime: "21:00",
          capacityPerDay: 5,
        },
        {
          key: "midnight",
          label: "Midnight Special (10:00 PM - 12:30 AM)",
          startTime: "22:00",
          endTime: "00:30",
          capacityPerDay: 3,
        },
      ],
    },
    blackoutDates: {
      type: [Date],
      default: [],
    },
    serviceablePincodes: {
      type: [serviceablePincodeSchema],
      default: [
        { pincode: "122001", deliveryFeePaise: 0 },
        { pincode: "122002", deliveryFeePaise: 0 },
        { pincode: "122003", deliveryFeePaise: 0 },
        { pincode: "122011", deliveryFeePaise: 0 },
        { pincode: "122018", deliveryFeePaise: 0 },
      ],
    },
    notificationEmails: {
      type: [String],
      default: ["decorjoygurgaon@gmail.com"],
    },
    socials: {
      instagram: {
        type: String,
        default: "https://instagram.com/decorjoygurgaon",
      },
      facebook: {
        type: String,
        default: "",
      },
      youtube: {
        type: String,
        default: "",
      },
    },
    homepage: {
      heroTitle: {
        type: String,
        default: "Luxury Event & Party Decorations in Gurgaon",
      },
      heroSubtitle: {
        type: String,
        default: "Your Celebration. Our Creation. Operating since 2021.",
      },
      blocks: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },
    // ── Graceful degradation switches (owner-controllable from admin Settings) ──
    flags: {
      bookingsPaused: {
        type: Boolean,
        default: false,
        // When true → shows bookings paused message
      },
      maintenanceBanner: {
        type: String,
        default: "",
        maxlength: 300,
        // Non-empty string shown as a top banner on the storefront
      },
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
  }
);

// Singleton helper
settingsSchema.statics.getSettings = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model("Settings", settingsSchema);
