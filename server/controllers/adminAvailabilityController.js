const { z } = require("zod");
const SlotBooking = require("../models/SlotBooking");
const Settings = require("../models/Settings");
const { getISTDateString, parseISTMidnight } = require("../utils/dateUtils");
const { recordAudit } = require("../services/auditService");

/**
 * GET /api/admin/availability/month?year=2026&month=10
 */
async function getMonthAvailability(req, res, next) {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-12

    // First day and last day of month in IST
    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const startDate = parseISTMidnight(startStr);
    const daysInMonth = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    const endDate = parseISTMidnight(endStr);

    const settings = await Settings.getSettings();
    const defaultSlots = settings.slots || [];
    const blackoutDatesSet = new Set(
      (settings.blackoutDates || []).map((b) => getISTDateString(b))
    );

    // Fetch all bookings for this month
    const bookings = await SlotBooking.find({
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const bookingMap = {};
    for (const b of bookings) {
      const d = getISTDateString(b.date);
      if (!bookingMap[d]) bookingMap[d] = {};
      bookingMap[d][b.slotKey] = b.booked;
    }

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isBlackout = blackoutDatesSet.has(dStr);

      const slots = defaultSlots.map((slot) => {
        const booked = (bookingMap[dStr] && bookingMap[dStr][slot.key]) || 0;
        const capacity = isBlackout ? 0 : slot.capacityPerDay || 5;
        return {
          key: slot.key,
          label: slot.label,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity,
          booked,
          remaining: Math.max(0, capacity - booked),
        };
      });

      const totalBooked = slots.reduce((acc, s) => acc + s.booked, 0);
      const totalCapacity = slots.reduce((acc, s) => acc + s.capacity, 0);

      days.push({
        date: dStr,
        dayNumber: day,
        isBlackout,
        totalBooked,
        totalCapacity,
        slots,
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        year,
        month,
        days,
        slotsConfig: defaultSlots,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/availability/toggle-block
 * Body: { date: "YYYY-MM-DD" }
 */
async function toggleBlockDate(req, res, next) {
  try {
    const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.body);
    const dateObj = parseISTMidnight(date);

    const settings = await Settings.getSettings();
    const existingIndex = settings.blackoutDates.findIndex(
      (b) => getISTDateString(b) === date
    );

    let isBlocked = false;
    if (existingIndex >= 0) {
      // Unblock
      settings.blackoutDates.splice(existingIndex, 1);
      isBlocked = false;
    } else {
      // Block
      settings.blackoutDates.push(dateObj);
      isBlocked = true;
    }

    await settings.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: isBlocked ? "DATE_BLOCKED" : "DATE_UNBLOCKED",
      entity: "Settings",
      entityId: settings._id,
      before: null,
      after: { date, isBlocked },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: `Date ${date} is now ${isBlocked ? "blocked (blackout)" : "unblocked"}`,
      data: { date, isBlocked },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/availability/slot-capacity
 * Body: { slotKey: string, capacityPerDay: number }
 */
async function updateSlotCapacity(req, res, next) {
  try {
    const { slotKey, capacityPerDay } = z
      .object({
        slotKey: z.string().min(1),
        capacityPerDay: z.number().int().min(1).max(50),
      })
      .parse(req.body);

    const settings = await Settings.getSettings();
    const slot = settings.slots.find((s) => s.key === slotKey);
    if (!slot) {
      return res.status(404).json({ status: "fail", message: `Slot ${slotKey} not found` });
    }

    const prevCapacity = slot.capacityPerDay;
    slot.capacityPerDay = capacityPerDay;
    await settings.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "SLOT_CAPACITY_UPDATED",
      entity: "Settings",
      entityId: settings._id,
      before: { slotKey, capacityPerDay: prevCapacity },
      after: { slotKey, capacityPerDay },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      message: `Capacity for ${slot.label} updated to ${capacityPerDay}`,
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMonthAvailability,
  toggleBlockDate,
  updateSlotCapacity,
};
