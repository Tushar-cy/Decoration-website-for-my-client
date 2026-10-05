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
const Submission = require("../models/Submission");

describe("Admin v2 Role Guards, Operations & Lead CRM", () => {
  let ownerToken;
  let staffToken;
  let originalAdminFindById;
  let originalSettingsGet;
  let originalSubmissionCount;
  let originalSubmissionAggregate;
  let originalSubmissionFind;

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
          business: {
            name: "Decor Joy Gurgaon",
            phone: "+91 7015767715",
            whatsapp: "+91 7015767715",
          },
          serviceablePincodes: [{ pincode: "122001", deliveryFeePaise: 0 }],
          toObject: () => ({ business: { name: "Decor Joy Gurgaon" } }),
        });

      originalSubmissionCount = Submission.countDocuments;
      Submission.countDocuments = () => Promise.resolve(5);

      originalSubmissionAggregate = Submission.aggregate;
      Submission.aggregate = () => Promise.resolve([{ _id: "new", count: 5 }]);

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
    }
  });

  after(() => {
    Admin.findById = originalAdminFindById;
    if (originalSettingsGet) Settings.getSettings = originalSettingsGet;
    if (originalSubmissionCount) Submission.countDocuments = originalSubmissionCount;
    if (originalSubmissionAggregate) Submission.aggregate = originalSubmissionAggregate;
    if (originalSubmissionFind) Submission.find = originalSubmissionFind;
  });

  test("GET /api/admin/dashboard returns operational lead stats for staff", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("x-requested-with", "decorjoy")
      .set("Cookie", [`accessToken=${staffToken}`]);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, "success");
    assert.ok(res.body.data.hasOwnProperty("totalSubmissions"));
    assert.ok(res.body.data.hasOwnProperty("newSubmissionsCount"));
    assert.ok(res.body.data.hasOwnProperty("todaySubmissionsCount"));
    assert.ok(res.body.data.hasOwnProperty("thisWeekSubmissionsCount"));
    assert.ok(res.body.data.hasOwnProperty("statusBreakdown"));
    assert.ok(res.body.data.hasOwnProperty("occasionBreakdown"));
    assert.ok(res.body.data.hasOwnProperty("recentSubmissions"));
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
});
