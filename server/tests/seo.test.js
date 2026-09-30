const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const { app } = require("../server");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Settings = require("../models/Settings");
const Order = require("../models/Order");
const whatsappService = require("../services/whatsappService");
const { sendReviewRequestsSweep } = require("../worker");

describe("SEO & Local Search Endpoints and Workers", () => {
  let origSettingsGet;
  let origProductFind;
  let origCategoryFind;
  let origOrderFind;
  let origOrderFindOneAndUpdate;
  let origSendReviewRequest;

  before(() => {
    origSettingsGet = Settings.getSettings;
    Settings.getSettings = () =>
      Promise.resolve({
        business: {
          name: "Decor Joy Gurgaon",
          phone: "+91 7015767715",
          whatsapp: "+91 7015767715",
          email: "decorjoygurgaon@gmail.com",
          address: "166GF Sector 57 Gurugram, Haryana 122003",
          geo: { lat: 28.435, lng: 77.086 },
          openingHours: "Mo-Su 08:00-22:00",
          googleReviewUrl: "https://g.page/r/decorjoygurgaon/review",
        },
        slots: [
          { key: "morning", label: "Morning", startTime: "09:00", endTime: "13:00", capacityPerDay: 5 },
          { key: "evening", label: "Evening", startTime: "17:00", endTime: "21:00", capacityPerDay: 5 },
        ],
        serviceablePincodes: [{ pincode: "122003", deliveryFeePaise: 0 }],
        socials: {
          instagram: "https://instagram.com/decorjoygurgaon",
          facebook: "https://facebook.com/decorjoygurgaon",
        },
        flags: { onlinePayments: true, bookingsPaused: false, maintenanceBanner: "" },
      });

    origProductFind = Product.find;
    Product.find = () => {
      const q = {
        select: () => q,
        lean: () =>
          Promise.resolve([
            { slug: "luxury-balloon-arch", updatedAt: new Date("2026-09-28") },
            { slug: "birthday-cabana-decor", updatedAt: new Date("2026-09-29") },
          ]),
      };
      return q;
    };

    origCategoryFind = Category.find;
    Category.find = () => {
      const q = {
        select: () => q,
        lean: () =>
          Promise.resolve([
            { slug: "birthday", updatedAt: new Date("2026-09-20") },
            { slug: "anniversary", updatedAt: new Date("2026-09-21") },
          ]),
      };
      return q;
    };
  });

  after(() => {
    Settings.getSettings = origSettingsGet;
    Product.find = origProductFind;
    Category.find = origCategoryFind;
    if (origOrderFind) Order.find = origOrderFind;
    if (origOrderFindOneAndUpdate) Order.findOneAndUpdate = origOrderFindOneAndUpdate;
    if (origSendReviewRequest) whatsappService.sendReviewRequest = origSendReviewRequest;
  });

  test("GET /sitemap.xml returns valid XML with static, locality, and catalog URLs", async () => {
    const res = await request(app).get("/sitemap.xml");

    assert.strictEqual(res.status, 200);
    assert.match(res.headers["content-type"], /xml/);
    assert.ok(res.text.includes("<urlset"), "Must contain <urlset");
    assert.ok(res.text.includes("https://decorjoygurgaon.com/"), "Must contain root URL");
    assert.ok(res.text.includes("/locations/dlf-phase-5"), "Must contain DLF Phase 5 locality URL");
    assert.ok(res.text.includes("/locations/golf-course-road"), "Must contain Golf Course Road locality URL");
    assert.ok(res.text.includes("/locations/cyber-city"), "Must contain Cyber City locality URL");
    assert.ok(res.text.includes("/locations/sohna-road"), "Must contain Sohna Road locality URL");
    assert.ok(res.text.includes("/locations/sector-57-gurugram"), "Must contain Sector 57 locality URL");
    assert.ok(res.text.includes("/shop?category=birthday"), "Must contain category URLs");
    assert.ok(res.text.includes("/p/luxury-balloon-arch"), "Must contain product URLs");
  });

  test("GET /robots.txt returns valid robots file pointing to sitemap", async () => {
    const res = await request(app).get("/robots.txt");

    assert.strictEqual(res.status, 200);
    assert.match(res.headers["content-type"], /plain/);
    assert.ok(res.text.includes("User-agent: *"));
    assert.ok(res.text.includes("Disallow: /admin"));
    assert.ok(res.text.includes("Disallow: /api/admin"));
    assert.ok(res.text.includes("Sitemap: https://decorjoygurgaon.com/sitemap.xml"));
  });

  test("GET /api/settings/public returns complete LocalBusiness information", async () => {
    const res = await request(app).get("/api/settings/public");

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "success");
    const business = res.body.data.business;
    assert.ok(business, "Business info must exist");
    assert.strictEqual(business.name, "Decor Joy Gurgaon");
    assert.strictEqual(business.address, "166GF Sector 57 Gurugram, Haryana 122003");
    assert.ok(business.phone, "Must have contact phone");
    assert.strictEqual(business.googleReviewUrl, "https://g.page/r/decorjoygurgaon/review");
    assert.strictEqual(business.openingHours, "Mo-Su 08:00-22:00");
    assert.ok(Array.isArray(business.sameAs), "Must have sameAs array");
    assert.ok(business.sameAs.includes("https://instagram.com/decorjoygurgaon"));
  });

  test("sendReviewRequestsSweep triggers review prompt 2 hours post-slot", async () => {
    let sentReviewPayload = null;
    origSendReviewRequest = whatsappService.sendReviewRequest;
    whatsappService.sendReviewRequest = async (payload) => {
      sentReviewPayload = payload;
      return true;
    };

    const pastEventDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago

    origOrderFind = Order.find;
    Order.find = () => ({
      lean: () =>
        Promise.resolve([
          {
            _id: "679902000000000000000001",
            orderNumber: "DJ-2026-0099",
            customerSnapshot: {
              name: "Pooja Sharma",
              phone: "+919876543210",
            },
            event: {
              date: pastEventDate,
              slotKey: "morning",
            },
            status: "completed",
            reviewPromptSentAt: null,
          },
        ]),
    });

    let updatedDoc = null;
    origOrderFindOneAndUpdate = Order.findOneAndUpdate;
    Order.findOneAndUpdate = (filter, update) => {
      updatedDoc = { _id: filter._id, ...update.$set };
      return Promise.resolve(updatedDoc);
    };

    const result = await sendReviewRequestsSweep();
    assert.strictEqual(result.sentCount, 1, "Should send 1 review request");
    assert.ok(sentReviewPayload, "whatsappService.sendReviewRequest must have been invoked");
    assert.strictEqual(sentReviewPayload.customerName, "Pooja Sharma");
    assert.strictEqual(sentReviewPayload.orderNumber, "DJ-2026-0099");
    assert.ok(sentReviewPayload.googleReviewUrl.includes("decorjoygurgaon"));
    assert.ok(updatedDoc.reviewPromptSentAt instanceof Date, "reviewPromptSentAt must be set to Date");
  });

  test("Prerendered HTML: GET / returns real HTML with <h1> heading", async () => {
    const res = await request(app).get("/");
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("<h1"), 'Page must contain "<h1" tag');
    assert.ok(res.text.includes("Decor Joy"), "Heading must contain brand title");
  });

  test("Prerendered HTML: GET /shop returns real HTML with <h1> heading", async () => {
    const res = await request(app).get("/shop");
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("<h1"), 'Page must contain "<h1" tag');
    assert.ok(res.text.includes("Celebration Catalog"), "Heading must contain shop title");
  });

  test("Prerendered HTML: GET /about returns real HTML with <h1> heading", async () => {
    const res = await request(app).get("/about");
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("<h1"), 'Page must contain "<h1" tag');
    assert.ok(res.text.includes("About Decor Joy Gurgaon"), "Heading must contain about title");
  });

  test("Prerendered HTML: GET /locations/dlf-phase-5 returns real HTML with <h1> heading", async () => {
    const res = await request(app).get("/locations/dlf-phase-5");
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("<h1"), 'Page must contain "<h1" tag');
    assert.ok(res.text.includes("DLF Phase 5"), "Heading must mention DLF Phase 5");
  });

  test("Prerendered HTML: GET /locations/cyber-city returns real HTML with <h1> heading", async () => {
    const res = await request(app).get("/locations/cyber-city");
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("<h1"), 'Page must contain "<h1" tag');
    assert.ok(res.text.includes("Cyber City"), "Heading must mention Cyber City");
  });
});
