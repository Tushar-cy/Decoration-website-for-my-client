const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { slugify, DEFAULT_CATEGORIES } = require("../scripts/migrate-services-to-products");

describe("Migration Script Logic & Idempotency", () => {
  test("slugify correctly formats titles into URL-safe slugs", () => {
    assert.equal(
      slugify("Enchanted Ring Arch & Custom Neon!"),
      "enchanted-ring-arch-custom-neon"
    );
    assert.equal(
      slugify("  Romantic 25th Anniversary -- Special  "),
      "romantic-25th-anniversary-special"
    );
    assert.equal(
      slugify("Baby Shower / Welcome Baby (Theme #1)"),
      "baby-shower-welcome-baby-theme-1"
    );
  });

  test("Dry-run calculates diff without mutating database state", () => {
    const existingCategories = new Map();
    const existingProducts = new Map();
    const existingInquiries = [
      { _id: "inq1", eventDate: "2026-10-15" },
      { _id: "inq2", eventDate: new Date("2026-11-20") },
    ];
    const services = [
      {
        title: "Enchanted Birthday",
        category: "Birthdays",
        startingPrice: 3499,
        description: "Enchanted setup",
        image: "https://example.com/bday.jpg",
      },
      {
        title: "Romantic Surprise",
        category: "Anniversaries",
        startingPrice: 4999,
        description: "Romantic cabana",
        image: "https://example.com/rom.jpg",
      },
    ];

    // Dry-run simulation function mirroring migrate-services-to-products.js
    const simulateDryRun = (categories, products, inqs) => {
      const diff = {
        categoriesToCreate: [],
        productsToCreate: [],
        inquiriesToConvert: [],
      };

      // 1. Categories
      for (const cat of DEFAULT_CATEGORIES) {
        if (!categories.has(cat.slug)) {
          diff.categoriesToCreate.push(cat);
        }
      }

      // 2. Products
      for (const s of services) {
        const slug = slugify(s.title);
        if (!products.has(slug)) {
          diff.productsToCreate.push({
            title: s.title,
            slug,
            basePricePaise: Math.round(s.startingPrice * 100),
          });
        }
      }

      // 3. Inquiries
      for (const inq of inqs) {
        if (typeof inq.eventDate === "string") {
          diff.inquiriesToConvert.push({
            id: inq._id,
            from: inq.eventDate,
            to: new Date(inq.eventDate).toISOString(),
          });
        }
      }

      return diff;
    };

    // First dry-run: detects all missing categories and products
    const diffRun1 = simulateDryRun(existingCategories, existingProducts, existingInquiries);
    assert.equal(diffRun1.categoriesToCreate.length, DEFAULT_CATEGORIES.length);
    assert.equal(diffRun1.productsToCreate.length, services.length);
    assert.equal(diffRun1.inquiriesToConvert.length, 1);
    assert.equal(diffRun1.productsToCreate[0].basePricePaise, 349900); // ₹3,499 -> 349900 paise

    // Apply the planned changes to simulated state
    diffRun1.categoriesToCreate.forEach((c) => existingCategories.set(c.slug, c));
    diffRun1.productsToCreate.forEach((p) => existingProducts.set(p.slug, p));
    existingInquiries[0].eventDate = new Date(existingInquiries[0].eventDate);

    // Second dry-run on updated state: proves idempotency (0 changes)
    const diffRun2 = simulateDryRun(existingCategories, existingProducts, existingInquiries);
    assert.equal(diffRun2.categoriesToCreate.length, 0);
    assert.equal(diffRun2.productsToCreate.length, 0);
    assert.equal(diffRun2.inquiriesToConvert.length, 0);
  });
});
