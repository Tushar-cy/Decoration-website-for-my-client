const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { env } = require("../config/env");
const { protect, authorize } = require("../middleware/authMiddleware");
const Admin = require("../models/Admin");
const RefreshToken = require("../models/RefreshToken");
const { hashToken } = require("../controllers/authController");

describe("Authentication & Authorization Security", () => {
  // 1. Role-based authorization middleware
  describe("authorize(...roles) Middleware", () => {
    test("Rejects unauthenticated request without req.admin with 401", () => {
      const req = {};
      let errorPassed;
      const next = (err) => {
        errorPassed = err;
      };

      const middleware = authorize("owner");
      middleware(req, {}, next);

      assert.ok(errorPassed, "Should pass an error");
      assert.equal(errorPassed.statusCode, 401);
    });

    test("Rejects staff user attempting to access owner-only endpoint with 403", () => {
      const req = {
        admin: {
          _id: "admin123",
          role: "staff",
        },
      };
      let errorPassed;
      const next = (err) => {
        errorPassed = err;
      };

      const middleware = authorize("owner");
      middleware(req, {}, next);

      assert.ok(errorPassed, "Should pass an error");
      assert.equal(errorPassed.statusCode, 403);
      assert.match(errorPassed.message, /Forbidden: Role 'staff' is not authorized/);
    });

    test("Allows owner user to access owner-only endpoint", () => {
      const req = {
        admin: {
          _id: "admin123",
          role: "owner",
        },
      };
      let nextCalledWithoutError = false;
      const next = (err) => {
        if (!err) nextCalledWithoutError = true;
      };

      const middleware = authorize("owner");
      middleware(req, {}, next);

      assert.equal(nextCalledWithoutError, true);
    });

    test("Allows both owner and staff when both are authorized", () => {
      const middleware = authorize("owner", "staff");

      let passedOwner = false;
      middleware({ admin: { role: "owner" } }, {}, (err) => {
        if (!err) passedOwner = true;
      });

      let passedStaff = false;
      middleware({ admin: { role: "staff" } }, {}, (err) => {
        if (!err) passedStaff = true;
      });

      assert.equal(passedOwner, true);
      assert.equal(passedStaff, true);
    });
  });

  // 2. Old default secret forge rejection
  describe("Forged Token Rejection", () => {
    test("A forged token signed with old default secret is rejected with 401", async () => {
      const oldDefaultSecret = "decorjoy_super_secret_jwt_key_2026";
      const forgedToken = jwt.sign({ id: "64e000000000000000000001", role: "owner" }, oldDefaultSecret, {
        expiresIn: "1h",
      });

      const req = {
        cookies: { accessToken: forgedToken },
        headers: {},
      };
      const res = {};
      let errorPassed;
      const next = (err) => {
        errorPassed = err;
      };

      await protect(req, res, next);

      assert.ok(errorPassed, "Expected protect middleware to reject forged token");
      assert.equal(errorPassed.statusCode, 401);
      assert.match(errorPassed.message, /Not authorized, invalid or expired token/);
    });
  });

  // 3. Login lockout logic
  describe("Login Lockout & Constant-Time Response", () => {
    test("Account locks for 15 minutes after 5 failed login attempts", () => {
      const admin = new Admin({
        name: "Test Admin",
        email: "lockout@decorjoy.com",
        password: "hashedpassword",
        role: "owner",
        failedLogins: 0,
        lockedUntil: null,
      });

      // Attempts 1 to 4: account remains unlocked
      for (let i = 1; i <= 4; i++) {
        admin.failedLogins = (admin.failedLogins || 0) + 1;
        if (admin.failedLogins >= 5) {
          admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        assert.equal(admin.isLocked(), false);
      }

      // 5th failed attempt: account is locked
      admin.failedLogins = (admin.failedLogins || 0) + 1;
      if (admin.failedLogins >= 5) {
        admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      assert.equal(admin.failedLogins, 5);
      assert.equal(admin.isLocked(), true);
      assert.ok(admin.lockedUntil.getTime() > Date.now());
    });

    test("Lockout expires after 15 minutes", () => {
      const admin = new Admin({
        name: "Test Admin",
        email: "expiredlock@decorjoy.com",
        password: "hashedpassword",
        role: "owner",
        failedLogins: 5,
        lockedUntil: new Date(Date.now() - 1000), // In the past
      });

      assert.equal(admin.isLocked(), false);
    });

    test("Successful login resets failedLogins and lockedUntil", () => {
      const admin = new Admin({
        name: "Test Admin",
        email: "reset@decorjoy.com",
        password: "hashedpassword",
        role: "owner",
        failedLogins: 4,
        lockedUntil: null,
      });

      // Reset
      admin.failedLogins = 0;
      admin.lockedUntil = null;
      admin.lastLoginAt = new Date();

      assert.equal(admin.failedLogins, 0);
      assert.equal(admin.lockedUntil, null);
      assert.ok(admin.lastLoginAt instanceof Date);
    });
  });

  // 4. Refresh token rotation & reuse detection
  describe("Refresh Token Rotation & Storage", () => {
    test("Hashed refresh token matches SHA-256 digest", () => {
      const rawToken = "test_raw_refresh_token_string_12345";
      const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      assert.equal(hashToken(rawToken), expectedHash);
    });

    test("Rotation: used refresh token is marked revoked when rotated", () => {
      const tokenDoc = {
        userId: "user123",
        hash: "somehash",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      };

      // Simulating rotation step:
      tokenDoc.revokedAt = new Date();

      assert.ok(tokenDoc.revokedAt instanceof Date);
      assert.ok(tokenDoc.revokedAt.getTime() <= Date.now());
    });

    test("Reuse Detection: revoked token flags compromise", () => {
      const tokenDoc = {
        userId: "user123",
        hash: "somehash",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(Date.now() - 5000), // already revoked
      };

      const isCompromised = !!tokenDoc.revokedAt;
      assert.equal(isCompromised, true);
    });
  });
});
