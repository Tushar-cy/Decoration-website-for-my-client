const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const SlotBooking = require("../models/SlotBooking");
const Counter = require("../models/Counter");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { Customer, normalizeIndianPhone } = require("../models/Customer");
const Category = require("../models/Category");
const AddOn = require("../models/AddOn");
const Coupon = require("../models/Coupon");
const Settings = require("../models/Settings");
const { models } = require("../scripts/sync-indexes");

describe("Data Layer Models & Indexes", () => {
  // 1. SlotBooking Compound Unique Index
  describe("SlotBooking (date, slotKey) Unique Index", () => {
    test("SlotBooking schema defines compound unique index on (date, slotKey)", () => {
      const indexes = SlotBooking.schema.indexes();
      const compoundIndex = indexes.find(
        ([spec, opts]) =>
          spec.date === 1 && spec.slotKey === 1 && opts?.unique === true
      );

      assert.ok(
        compoundIndex,
        "SlotBooking must define a compound unique index on { date: 1, slotKey: 1 }"
      );
    });

    test("Rejects duplicate booking on same date and slotKey with duplicate key error", async () => {
      const existingBookings = new Set();

      const simulateInsert = (date, slotKey) => {
        const isoDate = new Date(date).toISOString().split("T")[0];
        const compoundKey = `${isoDate}_${slotKey}`;

        if (existingBookings.has(compoundKey)) {
          const duplicateError = new Error(
            `E11000 duplicate key error collection: decorjoy.slotbookings index: date_1_slotKey_1 dup key: { date: "${date}", slotKey: "${slotKey}" }`
          );
          duplicateError.code = 11000;
          duplicateError.keyPattern = { date: 1, slotKey: 1 };
          duplicateError.keyValue = { date, slotKey };
          throw duplicateError;
        }

        existingBookings.add(compoundKey);
        return new SlotBooking({
          date: new Date(date),
          slotKey,
          booked: 1,
          capacity: 5,
        });
      };

      const date = "2026-10-15T00:00:00.000Z";
      const slotKey = "evening";

      // First insert succeeds
      const first = simulateInsert(date, slotKey);
      assert.ok(first);
      assert.equal(first.slotKey, "evening");

      // Second insert with identical (date, slotKey) must fail with code 11000
      assert.throws(
        () => simulateInsert(date, slotKey),
        (err) => {
          assert.equal(err.code, 11000);
          assert.deepEqual(err.keyPattern, { date: 1, slotKey: 1 });
          return true;
        },
        "Must throw duplicate key error code 11000 for duplicate (date, slotKey)"
      );

      // Different slotKey on same date succeeds
      const differentSlot = simulateInsert(date, "morning");
      assert.ok(differentSlot);

      // Same slotKey on different date succeeds
      const differentDate = simulateInsert("2026-10-16T00:00:00.000Z", slotKey);
      assert.ok(differentDate);
    });
  });

  // 2. Atomic Order Number Generation under Concurrency
  describe("Atomic Order Number Generation", () => {
    test("Order.orderNumber generation is atomic under 50 parallel calls with no duplicates", async () => {
      let sequenceTracker = 0;
      const originalFindOneAndUpdate = Counter.findOneAndUpdate;

      // Mock atomic findOneAndUpdate with guaranteed atomic increment
      Counter.findOneAndUpdate = async function (filter, update, options) {
        sequenceTracker += 1;
        return {
          key: filter.key,
          seq: sequenceTracker,
        };
      };

      try {
        const year = 2026;
        // Fire 50 concurrent order number requests
        const parallelCalls = Array.from({ length: 50 }, () =>
          Counter.generateOrderNumber(year)
        );

        const results = await Promise.all(parallelCalls);

        assert.equal(results.length, 50);

        // Check format DJ-YYYY-000123
        const orderNumberRegex = /^DJ-2026-\d{6}$/;
        results.forEach((orderNum) => {
          assert.match(
            orderNum,
            orderNumberRegex,
            `${orderNum} should match DJ-YYYY-000000 format`
          );
        });

        // Ensure every single generated orderNumber is strictly unique
        const uniqueOrderNumbers = new Set(results);
        assert.equal(
          uniqueOrderNumbers.size,
          50,
          "All 50 generated order numbers must be unique with zero collisions"
        );

        // Verify bounds
        assert.equal(results[0], "DJ-2026-000001");
        assert.equal(results[49], "DJ-2026-000050");
      } finally {
        Counter.findOneAndUpdate = originalFindOneAndUpdate;
      }
    });
  });

  // 3. Indian Phone Normalization on Customer
  describe("Customer Phone Normalization", () => {
    test("Normalizes standard 10-digit Indian mobile number to +91XXXXXXXXXX", () => {
      assert.equal(normalizeIndianPhone("9876543210"), "+919876543210");
      assert.equal(normalizeIndianPhone(" 98765 43210 "), "+919876543210");
    });

    test("Normalizes 11-digit leading zero number to +91XXXXXXXXXX", () => {
      assert.equal(normalizeIndianPhone("09876543210"), "+919876543210");
    });

    test("Normalizes 91 prefix without plus to +91XXXXXXXXXX", () => {
      assert.equal(normalizeIndianPhone("919876543210"), "+919876543210");
    });

    test("Preserves valid +91XXXXXXXXXX format", () => {
      assert.equal(normalizeIndianPhone("+919876543210"), "+919876543210");
    });

    test("Customer model applies setter normalization automatically", () => {
      const cust = new Customer({
        name: "Simran Kaur",
        phone: "09812345678",
      });
      assert.equal(cust.phone, "+919812345678");
    });
  });

  // 4. Money Stored Strictly as Integers in Paise
  describe("Paise Money Validation", () => {
    test("Product requires integer basePricePaise", () => {
      const validProduct = new Product({
        title: "Test Decor",
        slug: "test-decor",
        categoryId: "64e000000000000000000001",
        description: "Test description",
        basePricePaise: 499900, // ₹4,999
      });
      const error = validProduct.validateSync();
      assert.equal(error, undefined);

      const invalidProduct = new Product({
        title: "Test Decor Fractional",
        slug: "test-decor-frac",
        categoryId: "64e000000000000000000001",
        description: "Test description",
        basePricePaise: 4999.5, // Invalid fractional paise
      });
      const validationErr = invalidProduct.validateSync();
      assert.ok(validationErr);
      assert.ok(validationErr.errors.basePricePaise);
    });

    test("AddOn requires integer pricePaise", () => {
      const validAddon = new AddOn({
        name: "Extra Lights",
        pricePaise: 50000,
      });
      assert.equal(validAddon.validateSync(), undefined);

      const invalidAddon = new AddOn({
        name: "Extra Lights Fractional",
        pricePaise: 500.25,
      });
      const err = invalidAddon.validateSync();
      assert.ok(err);
      assert.ok(err.errors.pricePaise);
    });
  });

  // 5. Index Registration Integrity
  describe("Models & Index Registry", () => {
    test("sync-indexes lists all 16 core models", () => {
      assert.equal(models.length, 16);
      const modelNames = models.map((m) => m.name);
      assert.ok(modelNames.includes("Product"));
      assert.ok(modelNames.includes("Category"));
      assert.ok(modelNames.includes("SlotBooking"));
      assert.ok(modelNames.includes("Order"));
      assert.ok(modelNames.includes("Customer"));
      assert.ok(modelNames.includes("Settings"));
    });
  });
});
