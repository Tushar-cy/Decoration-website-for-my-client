const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const { app } = require("../server");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Settings = require("../models/Settings");

describe("Storefront Showcase Catalogue & Public Settings", () => {
  let origSettingsGet;
  let origProductFind;
  let origProductCount;
  let origCategoryFind;

  before(() => {
    origSettingsGet = Settings.getSettings;
    Settings.getSettings = () =>
      Promise.resolve({
        business: {
          name: "Decor Joy Gurgaon",
          phone: "+91 7015767715",
          whatsapp: "+91 7015767715",
          email: "decorjoygurgaon@gmail.com",
          address: "Sector 57, Gurugram, Haryana",
          geo: { lat: 28.4239, lng: 77.0863 },
        },
        serviceablePincodes: [
          { pincode: "122001", deliveryFeePaise: 0 },
          { pincode: "122011", deliveryFeePaise: 20000 },
        ],
        socials: {
          instagram: "https://instagram.com/decorjoygurgaon",
        },
        flags: {
          bookingsPaused: false,
          maintenanceBanner: "",
        },
      });

    origProductFind = Product.find;
    Product.find = () => {
      const queryObj = {
        select: () => queryObj,
        populate: () => queryObj,
        sort: () => queryObj,
        skip: () => queryObj,
        limit: () => queryObj,
        lean: () =>
          Promise.resolve([
            {
              _id: "679901000000000000000001",
              title: "Signature Ring Arch",
              slug: "signature-ring-arch",
              basePricePaise: 449900,
              images: [{ url: "https://example.com/arch.jpg", alt: "Arch" }],
              ratingAvg: 4.9,
              ratingCount: 120,
              isActive: true,
              deletedAt: null,
            },
          ]),
      };
      return queryObj;
    };

    origProductCount = Product.countDocuments;
    Product.countDocuments = () => Promise.resolve(1);

    origCategoryFind = Category.find;
    Category.find = () => {
      const catQuery = {
        select: () => catQuery,
        sort: () => catQuery,
        lean: () =>
          Promise.resolve([
            { _id: "679900000000000000000001", name: "Birthdays", slug: "birthdays" },
            { _id: "679900000000000000000002", name: "Anniversaries", slug: "anniversaries" },
          ]),
      };
      return catQuery;
    };
  });

  after(() => {
    if (origSettingsGet) Settings.getSettings = origSettingsGet;
    if (origProductFind) Product.find = origProductFind;
    if (origProductCount) Product.countDocuments = origProductCount;
    if (origCategoryFind) Category.find = origCategoryFind;
  });

  test("GET /api/settings/public returns whitelisted business info and pincodes", async () => {
    const res = await request(app).get("/api/settings/public");

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(res.body.data.business);
    assert.strictEqual(res.body.data.business.phone, "+91 7015767715");
    assert.strictEqual(res.body.data.business.whatsapp, "+91 7015767715");
    assert.ok(Array.isArray(res.body.data.serviceablePincodes));
    // Verify no secret leakage
    assert.strictEqual(res.body.data.hasOwnProperty("jwtSecret"), false);
    assert.strictEqual(res.body.data.hasOwnProperty("mongoUri"), false);
  });

  test("GET /api/settings/flags returns storefront operational flags", async () => {
    const res = await request(app).get("/api/settings/flags");

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.strictEqual(typeof res.body.data.bookingsPaused, "boolean");
    assert.strictEqual(typeof res.body.data.maintenanceBanner, "string");
  });

  test("GET /api/products returns paginated catalog without fallbacks", async () => {
    const res = await request(app).get("/api/products?page=1&limit=5");

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(Array.isArray(res.body.data.products));
    assert.strictEqual(res.body.data.products.length, 1);
    assert.strictEqual(res.body.data.products[0].slug, "signature-ring-arch");
    assert.strictEqual(res.body.data.pagination.page, 1);
  });

  test("GET /api/categories returns active categories list", async () => {
    const res = await request(app).get("/api/categories");

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(Array.isArray(res.body.data.categories));
    assert.strictEqual(res.body.data.categories.length, 2);
  });
});
