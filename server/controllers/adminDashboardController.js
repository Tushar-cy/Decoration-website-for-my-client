const Submission = require("../models/Submission");
const { getISTDateString, parseISTMidnight } = require("../utils/dateUtils");

/**
 * GET /api/admin/dashboard
 * Aggregates statistics for lead inquiries, submissions by occasion,
 * status breakdown, and recent submissions requiring attention.
 */
async function getDashboardStats(req, res, next) {
  try {
    const todayStr = getISTDateString();
    const todayMidnight = parseISTMidnight(todayStr);
    const weekAgo = new Date(todayMidnight.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalSubmissions,
      newSubmissionsCount,
      todaySubmissionsCount,
      thisWeekSubmissionsCount,
      statusAgg,
      occasionBreakdown,
      recentSubmissions,
    ] = await Promise.all([
      Submission.countDocuments(),
      Submission.countDocuments({ status: "new" }),
      Submission.countDocuments({ createdAt: { $gte: todayMidnight } }),
      Submission.countDocuments({ createdAt: { $gte: weekAgo } }),
      Submission.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $group: { _id: "$formKey", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Submission.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select("name phone email formKey status createdAt answers")
        .lean(),
    ]);

    const statusBreakdown = {
      new: 0,
      contacted: 0,
      quoted: 0,
      converted: 0,
      closed: 0,
      spam: 0,
    };

    for (const item of statusAgg) {
      if (item._id) {
        statusBreakdown[item._id] = item.count;
      }
    }

    return res.status(200).json({
      status: "success",
      data: {
        totalSubmissions,
        newSubmissionsCount,
        todaySubmissionsCount,
        thisWeekSubmissionsCount,
        statusBreakdown,
        occasionBreakdown,
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
