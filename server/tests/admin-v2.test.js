const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { app } = require("../server");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Admin = require("../models/Admin");
const Settings = require("../models/Settings");
const Order = require("../models/Order");
const Submission = require("../models/Submission");
const SlotBooking = require("../models/SlotBooking");

describe("Admin v2 Role Guards, Operations & Security", () => {
  let ownerToken;
  let staffToken;
  let originalAdminFindById;
  let originalSettingsGet;
  let originalOrderFind;
  let originalOrderCount;
  let originalOrderAggregate;
  let originalSubmissionCount;
  let originalSubmissionFind;
  let originalSlotBookingFind;

  before(async () => {
    const secret = process.env.JWT_ACCESS_SECRET;

    ownerToken = jwt.sign(
      { id: "owner-123", email: "owner@decorjoy.in", role: "owner" },
      secret,
      { expiresIn: "15m" }
    );

    staffToken = jwt.sign(
      { id: "staff-123", email: "staff@decorjoy.in", role: "staff" },
      secret,
      { expiresIn: "15m" }
    );

    // Stub Admin.findById
    originalAdminFindById = Admin.findById;
    Admin.findById = (id) => ({
      select: () => {
        if (id === "owner-123") {
          return Promise.resolve({
            _id: "owner-123",
            email: "owner@decorjoy.in",
            role: "owner",
            isActive: true,
          });
        }
        if (id === "staff-123") {
          return Promise.resolve({
            _id: "staff-123",
            email: "staff@decorjoy.in",
            role: "staff",
            isActive: true,
          });
        }
        return Promise.resolve(null);
      },
    });

    // If Mongo is not connected, mock model query methods
    if (mongoose.connection.readyState !== 1) {
      originalSettingsGet = Settings.getSettings;
      Settings.getSettings = () =>
        Promise.resolve({
          _id: "settings-id",
          slots: [
            { key: "morning", label: "Morning", startTime: "09:00", endTime: "13:00", capacityPerDay: 5 },
            { key: "afternoon", label: "Afternoon", startTime: "13:00", endTime: "17:00", capacityPerDay: 5 },
            { key: "evening", label: "Evening", startTime: "17:00", endTime: "21:00", capacityPerDay: 5 },
          ],
          blackoutDates: [],
          serviceablePincodes: [{ pincode: "122001", deliveryFeePaise: 0 }],
          advancePercent: 25,
          paymentMode: "advance_online",
          toObject: () => ({ advancePercent: 25, paymentMode: "advance_online" }),
        });

      originalOrderFind = Order.find;
      Order.find = () => ({
        select: () => ({ lean: () => Promise.resolve([]) }),
        lean: () => Promise.resolve([]),
      });

      originalOrderCount = Order.countDocuments;
      Order.countDocuments = () => Promise.resolve(2);

      originalOrderAggregate = Order.aggregate;
      Order.aggregate = () => Promise.resolve([{ total: 1500000 }]);

      originalSubmissionCount = Submission.countDocuments;
      Submission.countDocuments = () => Promise.resolve(5);

      originalSubmissionFind = Submission.find;
      Submission.find = () => ({
        sort: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([]),
            }),
          }),
        }),
      });

      originalSlotBookingFind = SlotBooking.find;
      SlotBooking.find = () => ({
        lean: () => Promise.resolve([]),
      });
    }
  });

  after(() => {
    Admin.findById = originalAdminFindById;
    if (originalSettingsGet) Settings.getSettings = originalSettingsGet;
    if (originalOrderFind) Order.find = originalOrderFind;
    if (originalOrderCount) Order.countDocuments = originalOrderCount;
    if (originalOrderAggregate) Order.aggregate = originalOrderAggregate;
    if (originalSubmissionCount) Submission.countDocuments = originalSubmissionCount;
    if (originalSubmissionFind) Submission.find = originalSubmissionFind;
    if (originalSlotBookingFind) SlotBooking.find = originalSlotBookingFind;
  });

  test("GET /api/admin/dashboard returns operational stats for staff", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(res.body.data.hasOwnProperty("todaySetups"));
    assert.ok(res.body.data.hasOwnProperty("ordersNeedingAction"));
    assert.ok(res.body.data.hasOwnProperty("revenueThisWeekPaise"));
    assert.ok(res.body.data.hasOwnProperty("slotLoad"));
  });

  test("GET /api/admin/settings: Staff access is forbidden with 403", async () => {
    const res = await request(app)
      .get("/api/admin/settings")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`]);

    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.body.message);
  });

  test("GET /api/admin/settings: Owner access succeeds with 200", async () => {
    const res = await request(app)
      .get("/api/admin/settings")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${ownerToken}`]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(res.body.data.settings);
  });

  test("GET /api/admin/users: Staff access is rejected with 403", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`]);

    assert.strictEqual(res.statusCode, 403);
  });

  test("POST /api/admin/uploads/signature returns signed upload parameters", async () => {
    const res = await request(app)
      .post("/api/admin/uploads/signature")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`])
      .send({ folder: "decorjoy/test" });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(res.body.data.signature);
    assert.ok(res.body.data.timestamp);
    assert.strictEqual(res.body.data.folder, "decorjoy/test");
  });

  test("DELETE /api/admin/products/:id: Staff cannot delete (403)", async () => {
    const res = await request(app)
      .delete("/api/admin/products/679901000000000000000001")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`]);

    assert.strictEqual(res.statusCode, 403);
  });

  test("GET /api/admin/availability/month returns full month grid", async () => {
    const res = await request(app)
      .get("/api/admin/availability/month?year=2026&month=10")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.strictEqual(res.body.data.days.length, 31);
    assert.ok(res.body.data.days[0].slots.length > 0);
  });
});
