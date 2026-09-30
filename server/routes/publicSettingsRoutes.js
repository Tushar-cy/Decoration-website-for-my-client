const express = require("express");
const Settings = require("../models/Settings");
const cache = require("../utils/cache");
const { publicCache } = require("../middleware/httpCache");

const router = express.Router();

/**
 * GET /api/settings/public
 * Returns whitelisted public business and storefront configuration.
 * Cached with Redis single-flight, stale-if-error, and HTTP edge cache headers.
 */
router.get("/public", publicCache(60, 600), async (req, res, next) => {
  try {
    const data = await cache.wrap(
      "cache:settings:public",
      600, // 10 minutes TTL
      async () => {
        const settings = await Settings.getSettings();

        return {
          business: {
            name: settings.business?.name || "Decor Joy Gurgaon",
            phone: settings.business?.phone || "+91 7015767715",
            whatsapp: settings.business?.whatsapp || "+91 7015767715",
            email: settings.business?.email || "decorjoygurgaon@gmail.com",
            address: settings.business?.address || "166GF Sector 57 Gurugram, Haryana 122003",
            geo: settings.business?.geo || { lat: 28.435, lng: 77.086 },
            openingHours: settings.business?.openingHours || "Mo-Su 08:00-22:00",
            googleReviewUrl: settings.business?.googleReviewUrl || "https://g.page/r/decorjoygurgaon/review",
            sameAs: [
              settings.socials?.instagram,
              settings.socials?.facebook,
              settings.socials?.youtube,
            ].filter(Boolean),
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
        };
      },
      { tags: ["settings"] }
    );

    return res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
