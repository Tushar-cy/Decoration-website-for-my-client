const Order = require("../models/Order");
const Submission = require("../models/Submission");
const SlotBooking = require("../models/SlotBooking");
const Settings = require("../models/Settings");
const { getISTDateString, parseISTMidnight } = require("../utils/dateUtils");

/**
 * GET /api/admin/dashboard
 * Aggregates statistics for today's setups, actionable orders, unpaid advances,
 * new purpose submissions, revenue this week/month, and 14-day slot load.
 */
async function getDashboardStats(req, res, next) {
  try {
    const todayStr = getISTDateString();
    const todayMidnight = parseISTMidnight(todayStr);
    const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
    const weekAgo = new Date(todayMidnight.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayMidnight.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Today's Setups (orders on today's date that are not cancelled)
    const todaySetups = await Order.find({
      date: { $gte: todayMidnight, $lt: tomorrowMidnight },
      status: { $ne: "cancelled" },
    })
      .select("orderNumber customer slotKey status totalPaise advanceDuePaise paidAmountPaise items deliveryNotes")
      .lean();

    // 2. Orders Needing Action (pending/confirmed but not in_progress or completed)
    const ordersNeedingAction = await Order.countDocuments({
      status: { $in: ["pending", "confirmed"] },
    });

    // 3. Unpaid Advances
    const unpaidAdvances = await Order.countDocuments({
      paymentStatus: { $in: ["unpaid", "partial"] },
      status: { $ne: "cancelled" },
    });

    // 4. New Submissions (waiting for contact)
    const newSubmissionsCount = await Submission.countDocuments({
      status: "new",
    });

    // 5. Revenue This Week & This Month (sum of paidAmountPaise)
    const [revenueWeekAgg, revenueMonthAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: weekAgo }, paymentStatus: { $in: ["paid", "partial"] } } },
        { $group: { _id: null, total: { $sum: "$paidAmountPaise" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthAgo }, paymentStatus: { $in: ["paid", "partial"] } } },
        { $group: { _id: null, total: { $sum: "$paidAmountPaise" } } },
      ]),
    ]);

    const revenueThisWeekPaise = revenueWeekAgg[0]?.total || 0;
    const revenueThisMonthPaise = revenueMonthAgg[0]?.total || 0;

    // 6. Next 14 Days Slot Load
    const settings = await Settings.getSettings();
    const defaultCapacity = 5;
    const slotKeys = (settings.slots || []).map((s) => s.key);
    const totalSlotCapacityPerDay = (settings.slots || []).reduce(
      (acc, s) => acc + (s.capacityPerDay || defaultCapacity),
      0
    ) || (slotKeys.length * defaultCapacity || 20);

    const next14Days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(todayMidnight.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = getISTDateString(d);
      next14Days.push({ date: dateStr, dateObj: d });
    }

    const bookings = await SlotBooking.find({
      date: {
        $gte: todayMidnight,
        $lte: next14Days[next14Days.length - 1].dateObj,
      },
    }).lean();

    const bookingMap = {};
    for (const b of bookings) {
      const dStr = getISTDateString(b.date);
      bookingMap[dStr] = (bookingMap[dStr] || 0) + (b.booked || 0);
    }

    const blackoutSet = new Set(
      (settings.blackoutDates || []).map((b) => getISTDateString(b))
    );

    const slotLoad = next14Days.map(({ date }) => {
      const isBlackout = blackoutSet.has(date);
      const booked = bookingMap[date] || 0;
      return {
        date,
        booked,
        capacity: isBlackout ? 0 : totalSlotCapacityPerDay,
        isBlackout,
        loadPercent: isBlackout
          ? 100
          : Math.min(100, Math.round((booked / totalSlotCapacityPerDay) * 100)),
      };
    });

    // 7. Recent submissions preview
    const recentSubmissions = await Submission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name phone formKey status createdAt answers")
      .lean();

    return res.status(200).json({
      status: "success",
      data: {
        todaySetups,
        ordersNeedingAction,
        unpaidAdvances,
        newSubmissionsCount,
        revenueThisWeekPaise,
        revenueThisMonthPaise,
        slotLoad,
        recentSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
};
