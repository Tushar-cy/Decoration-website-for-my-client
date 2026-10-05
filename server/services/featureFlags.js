/**
 * server/services/featureFlags.js
 * Operational switches stored in MongoDB Settings.
 *
 * Flags (stored in Settings document under `flags`):
 *  - bookingsPaused:   boolean (default false). When true → indicates bookings paused.
 *  - maintenanceBanner: string (default ""). When non-empty → shown on storefront.
 */
const Settings = require("../models/Settings");
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
      bookingsPaused: !!settings.flags?.bookingsPaused,
      maintenanceBanner: settings.flags?.maintenanceBanner || "",
    };

    _cached = flags;
    _cachedAt = now;
    return flags;
  } catch (err) {
    logger.warn({ err }, "featureFlags: could not load Settings, using defaults");
    return _cached || {
      bookingsPaused: false,
      maintenanceBanner: "",
    };
  }
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
  areBookingsPaused,
  getMaintenanceBanner,
  invalidate,
};
