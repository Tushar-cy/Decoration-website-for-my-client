const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { validateEnv } = require("../config/env");

describe("Environment Configuration Validation", () => {
  const validBaseEnv = {
    NODE_ENV: "test",
    PORT: "5000",
    MONGO_URI: "mongodb://127.0.0.1:27017/decorjoy_test",
    JWT_ACCESS_SECRET: "12345678901234567890123456789012345", // >32 chars
    JWT_REFRESH_SECRET: "98765432109876543210987654321098765", // >32 chars
    CLIENT_URL: "http://localhost:5173,http://localhost:3000",
    REDIS_URL: "redis://127.0.0.1:6379",
  };

  test("Refuses to boot when JWT_ACCESS_SECRET is missing", () => {
    const invalidEnv = { ...validBaseEnv };
    delete invalidEnv.JWT_ACCESS_SECRET;

    assert.throws(
      () => validateEnv(invalidEnv),
      /JWT_ACCESS_SECRET is required/
    );
  });

  test("Refuses to boot when JWT_ACCESS_SECRET is under 32 characters", () => {
    const invalidEnv = {
      ...validBaseEnv,
      JWT_ACCESS_SECRET: "too_short_secret",
    };

    assert.throws(
      () => validateEnv(invalidEnv),
      /at least 32 characters long/
    );
  });

  test("Refuses to boot when MONGO_URI is missing", () => {
    const invalidEnv = { ...validBaseEnv };
    delete invalidEnv.MONGO_URI;

    assert.throws(
      () => validateEnv(invalidEnv),
      /MONGO_URI is required/
    );
  });

  test("Refuses to boot when REDIS_URL is missing", () => {
    const invalidEnv = { ...validBaseEnv };
    delete invalidEnv.REDIS_URL;

    assert.throws(
      () => validateEnv(invalidEnv),
      /REDIS_URL is required/
    );
  });

  test("Refuses to boot when CLIENT_URL is missing", () => {
    const invalidEnv = { ...validBaseEnv };
    delete invalidEnv.CLIENT_URL;

    assert.throws(
      () => validateEnv(invalidEnv),
      /CLIENT_URL is required/
    );
  });

  test("Successfully parses and splits CLIENT_URL into clientOrigins allowlist", () => {
    const result = validateEnv(validBaseEnv);
    assert.equal(result.PORT, 5000);
    assert.equal(result.NODE_ENV, "test");
    assert.deepEqual(result.clientOrigins, [
      "http://localhost:5173",
      "http://localhost:3000",
    ]);
  });
});
