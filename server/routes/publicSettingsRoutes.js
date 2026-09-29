const express = require("express");
const Settings = require("../models/Settings");

const router = express.Router();

/**
 * GET /api/settings/public
 * Returns whitelisted public business and storefront configuration.
 */
router.get("/public", async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    return res.status(200).json({
      status: "success",
      data: {
        business: {
          name: settings.business?.name || "Decor Joy Gurgaon",
          phone: settings.business?.phone || "+91 7015767715",
          whatsapp: settings.business?.whatsapp || "+91 7015767715",
          email: settings.business?.email || "decorjoygurgaon@gmail.com",
          address: settings.business?.address || "Sector 57, Gurugram, Haryana",
          geo: settings.business?.geo || { lat: 28.4239, lng: 77.0863 },
        },
        slots: (settings.slots || []).map((s) => ({
          key: s.key,
          label: s.label,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        serviceablePincodes: (settings.serviceablePincodes || []).map((p) => ({
          pincode: p.pincode,
          deliveryFeePaise: p.deliveryFeePaise,
        })),
        advancePercent: settings.advancePercent || 25,
        paymentMode: settings.paymentMode || "advance_online",
        socials: settings.socials || {},
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
