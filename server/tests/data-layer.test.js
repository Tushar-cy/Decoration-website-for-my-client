const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const Product = require("../models/Product");
const Category = require("../models/Category");
const AddOn = require("../models/AddOn");
const Settings = require("../models/Settings");
const Submission = require("../models/Submission");
const FormSchema = require("../models/FormSchema");
const { normalizeIndianPhone } = require("../utils/phoneUtils");
const { models } = require("../scripts/sync-indexes");

describe("Data Layer Models & Indexes", () => {
  // 1. Indian Phone Normalization & Submission Model Setter
  describe("Phone Normalization & Submission Schema", () => {
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

    test("Submission model applies phone normalization setter automatically", () => {
      const sub = new Submission({
        formKey: "birthday",
        formVersion: 1,
        name: "Simran Kaur",
        phone: "09812345678",
        answers: { theme: "Pastel" },
      });
      assert.equal(sub.phone, "+919812345678");
    });
  });

  // 2. Money Stored Strictly as Integers in Paise
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

  // 3. Index Registration Integrity
  describe("Models & Index Registry", () => {
    test("sync-indexes registers core catalogue, lead, and settings models", () => {
      assert.ok(models.length >= 10);
      const modelNames = models.map((m) => m.name);
      assert.ok(modelNames.includes("Product"));
      assert.ok(modelNames.includes("Category"));
      assert.ok(modelNames.includes("Settings"));
      assert.ok(modelNames.includes("FormSchema"));
      assert.ok(modelNames.includes("Submission"));
      assert.ok(modelNames.includes("AuditLog"));
      assert.ok(modelNames.includes("Gallery"));
      assert.ok(modelNames.includes("Testimonial"));
    });
  });
});
