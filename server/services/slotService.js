const SlotBooking = require("../models/SlotBooking");
const Settings = require("../models/Settings");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { redisClient } = require("../config/redis");
const {
  parseISTMidnight,
  formatISTDate,
  isSameISTDate,
  getISTDateTime,
} = require("../utils/dateUtils");
const { logger } = require("../utils/logger");

// In-memory cache fallback for availability with 15s TTL
const memoryAvailCache = new Map();

/**
 * Checks slot availability for a given date, product, and optional pincode.
 * Cached for 15 seconds.
 */
async function getAvailability({ dateStr, productId = null, pincode = null }) {
  const istDate = parseISTMidnight(dateStr);
  if (!istDate) {
    throw new AppError("Invalid date parameter. Format must be YYYY-MM-DD", 400);
  }

  const formattedDate = formatISTDate(istDate);
  const cacheKey = `avail:${formattedDate}:${productId || "none"}:${pincode || "none"}`;

  // 1. Check Redis or Memory cache
  if (redisClient.isReady) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Redis error fallback
    }
  } else {
    const memCached = memoryAvailCache.get(cacheKey);
    if (memCached && memCached.expiresAt > Date.now()) {
      return memCached.data;
    }
  }

  // 2. Fetch Settings
  const settings = await Settings.getSettings();

  // 3. Check Blackout dates
  const isBlackout = settings.blackoutDates?.some((bDate) =>
    isSameISTDate(bDate, istDate)
  );

  // 4. Check Pincode
  let isPincodeServiceable = true;
  let pincodeDeliveryFee = 0;
  if (pincode) {
    const cleanPincode = String(pincode).trim();
    const matched = settings.serviceablePincodes?.find(
      (p) => p.pincode === cleanPincode
    );
    if (matched) {
      pincodeDeliveryFee = matched.deliveryFeePaise || 0;
    } else {
      isPincodeServiceable = false;
    }
  }

  // 5. Min lead hours
  let minLeadHours = 24; // default
  if (productId) {
    const prod = await Product.findById(productId).select("minLeadHours").lean();
    if (prod && typeof prod.minLeadHours === "number") {
      minLeadHours = prod.minLeadHours;
    }
  }

  const now = Date.now();
  const leadCutoff = now + minLeadHours * 60 * 60 * 1000;

  // 6. Fetch existing slot bookings for this date
  const existingBookings = await SlotBooking.find({ date: istDate }).lean();
  const bookingMap = new Map();
  existingBookings.forEach((b) => bookingMap.set(b.slotKey, b));

  // 7. Calculate availability per slot
  const slots = (settings.slots || []).map((slotConfig) => {
    const slotDoc = bookingMap.get(slotConfig.key);
    const booked = slotDoc ? slotDoc.booked : 0;
    const capacity = slotConfig.capacityPerDay || 5;
    const remaining = Math.max(0, capacity - booked);

    // Calculate slot start time in IST
    const slotStartDateTime = getISTDateTime(istDate, slotConfig.startTime);
    const isPastLeadTime = slotStartDateTime
      ? slotStartDateTime.getTime() < leadCutoff
      : false;

    let available = true;
    let reason = null;

    if (isBlackout) {
      available = false;
      reason = "Date is marked as a blackout date (holiday/fully closed)";
    } else if (!isPincodeServiceable) {
      available = false;
      reason = "Location pincode is outside our service area";
    } else if (isPastLeadTime) {
      available = false;
      reason = `Requires at least ${minLeadHours}h advance booking lead time`;
    } else if (remaining <= 0) {
      available = false;
      reason = "Slot is fully booked";
    }

    return {
      key: slotConfig.key,
      label: slotConfig.label,
      startTime: slotConfig.startTime,
      endTime: slotConfig.endTime,
      capacity,
      booked,
      remaining: isBlackout || !isPincodeServiceable || isPastLeadTime ? 0 : remaining,
      available,
      reason,
    };
  });

  const responseData = {
    date: formattedDate,
    isBlackout: Boolean(isBlackout),
    pincode: pincode
      ? {
          pincode: String(pincode).trim(),
          serviceable: isPincodeServiceable,
          deliveryFeePaise: pincodeDeliveryFee,
        }
      : null,
    minLeadHours,
    slots,
  };

  // Cache for 15 seconds
  if (redisClient.isReady) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 15 });
    } catch (e) {}
  } else {
    memoryAvailCache.set(cacheKey, {
      data: responseData,
      expiresAt: Date.now() + 15000,
    });
  }

  return responseData;
}

/**
 * Atomically reserves a slot.
 * Uses findOneAndUpdate({ date, slotKey, booked: { $lt: capacity } }, { $inc: { booked: 1 } })
 * with duplicate-key retry on initial insertion.
 */
async function reserveSlotAtomic({ date, slotKey, capacity }) {
  const istDate = parseISTMidnight(date);
  if (!istDate) {
    throw new AppError("Invalid booking date", 400);
  }

  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    // 1. Try to increment existing document if capacity allows
    const updated = await SlotBooking.findOneAndUpdate(
      { date: istDate, slotKey, booked: { $lt: capacity } },
      { $inc: { booked: 1 } },
      { new: true }
    );

    if (updated) {
      return updated;
    }

    // 2. If null, check if document already exists
    const existing = await SlotBooking.findOne({ date: istDate, slotKey });
    if (existing) {
      // Document exists and booked >= capacity
      throw new AppError(
        `Slot '${slotKey}' is fully booked for ${formatISTDate(istDate)}`,
        409
      );
    }

    // 3. Document does not exist yet. Attempt to insert with booked: 1
    try {
      const created = await SlotBooking.create({
        date: istDate,
        slotKey,
        booked: 1,
        capacity,
      });
      return created;
    } catch (err) {
      // Handle race condition: another concurrent request created the document first
      if (err.code === 11000) {
        continue; // Loop and retry findOneAndUpdate
      }
      throw err;
    }
  }

  throw new AppError("Failed to reserve slot due to concurrent booking contention", 409);
}

/**
 * Atomically releases a previously reserved slot (compensating action or cancellation).
 */
async function releaseSlotAtomic({ date, slotKey }) {
  const istDate = parseISTMidnight(date);
  if (!istDate) return;

  await SlotBooking.updateOne(
    { date: istDate, slotKey, booked: { $gt: 0 } },
    { $inc: { booked: -1 } }
  );
}

module.exports = {
  getAvailability,
  reserveSlotAtomic,
  releaseSlotAtomic,
};
