const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../server");

describe("Hardening & Security Middlewares", () => {
  // 1. Health and readiness probes
  describe("Health & Readiness Checks", () => {
    test("GET /healthz returns 200 with process uptime", async () => {
      const res = await request(app).get("/healthz");
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
      assert.ok(typeof res.body.uptime === "number");
    });

    test("GET /readyz returns 503 when Mongo is down", async () => {
      // mongoose.connection.readyState is not 1 (connected) in unit test environment
      const res = await request(app).get("/readyz");
      assert.equal(res.status, 503);
      assert.equal(res.body.status, "unhealthy");
      assert.equal(res.body.mongo, "disconnected");
    });
  });

  // 2. CSRF Mutating header check
  describe("CSRF Header Enforcement", () => {
    test("POST request without X-Requested-With: decorjoy returns 403", async () => {
      const res = await request(app)
        .post("/api/inquiries")
        .send({ name: "Tester" });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /Missing or invalid X-Requested-With header/);
    });

    test("POST request with X-Requested-With: decorjoy bypasses CSRF check", async () => {
      const res = await request(app)
        .post("/api/inquiries")
        .set("X-Requested-With", "decorjoy")
        .send({}); // Invalid body triggers validation (400), not CSRF rejection (403)

      assert.notEqual(res.status, 403);
    });
  });

  // 3. Inquiry Rate Limiter: 5/min on POST /api/inquiries, 429 on 6th
  describe("Inquiry Rate Limiter", () => {
    test("6 rapid POST /api/inquiries returns 429 on the 6th", async () => {
      const responses = [];
      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post("/api/inquiries")
          .set("X-Requested-With", "decorjoy")
          .set("X-Forwarded-For", "203.0.113.195") // Unique IP for this test
          .send({}); // Fast 400 response from validateBody ensures rapid rate limiter evaluation
        responses.push(res.status);
      }

      // First 5 requests are permitted by rate limiter (fail validation with 400, not 429)
      for (let i = 0; i < 5; i++) {
        assert.equal(
          responses[i],
          400,
          `Request ${i + 1} should have been allowed under rate limit`
        );
      }

      // 6th request must be rate limited to 429
      assert.equal(
        responses[5],
        429,
        "The 6th rapid request must return 429 Too Many Requests"
      );
    });
  });

  // 4. Zod Input Validation & Mass Assignment Protection
  describe("Mass Assignment & Input Validation", () => {
    test("POST /api/inquiries rejects invalid input with 400", async () => {
      const res = await request(app)
        .post("/api/inquiries")
        .set("X-Requested-With", "decorjoy")
        .set("X-Forwarded-For", "203.0.113.196")
        .send({
          name: "",
          phone: "123", // too short
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Validation failed");
      assert.ok(res.body.details);
    });

    test("POST /api/auth/login rejects missing credentials with 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Requested-With", "decorjoy")
        .set("X-Forwarded-For", "203.0.113.197")
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.message, "Validation failed");
    });
  });
});
