/**
 * server/services/featureFlags.js
 * Graceful degradation switches stored in MongoDB Settings.
 *
 * Flags (all stored in Settings document under `flags`):
 *  - onlinePayments:   boolean (default true). When false → pay_on_confirmation.
 *  - bookingsPaused:   boolean (default false). When true → orders return 503.
 *  - maintenanceBanner: string (default ""). When non-empty → shown on storefront.
 *
 * Additional automatic degradation:
 *  - Razorpay circuit breaker OPEN → onlinePayments treated as false automatically.
 *  - Redis down → cache bypassed (already handled in cache.js).
 *  - Mongo election → db.js retries with backoff; 503 + Retry-After on exhaustion.
 *
 * Usage:
 *   const flags = await featureFlags.get();
 *   if (!flags.onlinePayments) { ... fallback ... }
 */
const Settings = require("../models/Settings");
const { razorpayBreaker } = require("../utils/circuitBreaker");
const { logger } = require("../utils/logger");

// In-memory cache: refresh every 60s to avoid hammering Mongo on every request
let _cached = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 60_000;

/**
 * Returns current feature flags from Settings.
 * Falls back to safe defaults if Mongo is unavailable.
 */
async function get() {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) {
    return _cached;
  }

  try {
    const settings = await Settings.getSettings();
    const flags = {
      onlinePayments: settings.flags?.onlinePayments !== false,
      bookingsPaused: !!settings.flags?.bookingsPaused,
      maintenanceBanner: settings.flags?.maintenanceBanner || "",
    };

    _cached = flags;
    _cachedAt = now;
    return flags;
  } catch (err) {
    logger.warn({ err }, "featureFlags: could not load Settings, using defaults");
    // Safe defaults: payments off, bookings open (do not block business)
    return _cached || {
      onlinePayments: false, // default OFF when DB is unreachable (safer)
      bookingsPaused: false,
      maintenanceBanner: "",
    };
  }
}

/**
 * Returns true if online payments are currently available.
 * Combines: Settings flag AND Razorpay circuit breaker state.
 */
async function isOnlinePaymentsAvailable() {
  const flags = await get();
  const razorpayOpen = razorpayBreaker.state === "OPEN";

  if (razorpayOpen && flags.onlinePayments) {
    // Razorpay just went down — log it once (circuit breaker already logged the trip)
    logger.warn("featureFlags: Razorpay circuit OPEN, auto-falling back to pay_on_confirmation");
  }

  return flags.onlinePayments && !razorpayOpen;
}

/**
 * Returns true if new bookings are paused.
 */
async function areBookingsPaused() {
  const flags = await get();
  return flags.bookingsPaused;
}

/**
 * Returns the current maintenance banner text, or "" if none.
 */
async function getMaintenanceBanner() {
  const flags = await get();
  return flags.maintenanceBanner;
}

/**
 * Invalidate in-memory cache (called after Settings save).
 */
function invalidate() {
  _cached = null;
  _cachedAt = 0;
}

module.exports = {
  get,
  isOnlinePaymentsAvailable,
  areBookingsPaused,
  getMaintenanceBanner,
  invalidate,
};
