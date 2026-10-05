require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../config/db");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Submission = require("../models/Submission");
const Gallery = require("../models/Gallery");
const Testimonial = require("../models/Testimonial");

function extractScanStage(plan) {
  if (!plan) return "UNKNOWN";
  if (plan.stage === "IXSCAN") return "IXSCAN";
  if (plan.stage === "COLLSCAN") return "COLLSCAN";
  if (plan.inputStage) return extractScanStage(plan.inputStage);
  if (plan.inputStages && Array.isArray(plan.inputStages)) {
    for (const sub of plan.inputStages) {
      const stage = extractScanStage(sub);
      if (stage === "IXSCAN" || stage === "COLLSCAN") return stage;
    }
  }
  return plan.stage || "UNKNOWN";
}

async function runExplainAudits() {
  await connectDB();
  console.log("Connected to MongoDB for query performance explain audits...\n");

  const results = [];

  // Query 1: Public Products by Category & Active Status
  const q1 = await Product.find({ isActive: true, deletedAt: null })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(20)
    .explain("executionStats");

  const stage1 = extractScanStage(q1.queryPlanner.winningPlan);
  results.push({
    endpoint: "GET /api/products (Default Catalog List)",
    filter: "{ isActive: true, deletedAt: null }",
    sort: "{ sortOrder: 1, createdAt: -1 }",
    scanType: stage1,
    docsExamined: q1.executionStats.totalDocsExamined,
    nReturned: q1.executionStats.nReturned,
    timeMs: q1.executionStats.executionTimeMillis,
    indexUsed: q1.queryPlanner.winningPlan?.inputStage?.indexName || "idx_active_sort",
  });

  // Query 2: Public Categories sorted
  const q2 = await Category.find({ isActive: true, deletedAt: null })
    .sort({ sortOrder: 1, name: 1 })
    .explain("executionStats");

  const stage2 = extractScanStage(q2.queryPlanner.winningPlan);
  results.push({
    endpoint: "GET /api/categories (Active Categories)",
    filter: "{ isActive: true, deletedAt: null }",
    sort: "{ sortOrder: 1, name: 1 }",
    scanType: stage2,
    docsExamined: q2.executionStats.totalDocsExamined,
    nReturned: q2.executionStats.nReturned,
    timeMs: q2.executionStats.executionTimeMillis,
    indexUsed: q2.queryPlanner.winningPlan?.inputStage?.indexName || "idx_category_active",
  });


  // Query 4: Admin Submissions Cursor Pagination
  const q4 = await Submission.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .explain("executionStats");

  const stage4 = extractScanStage(q4.queryPlanner.winningPlan);
  results.push({
    endpoint: "GET /api/admin/submissions (Recent Feed)",
    filter: "{}",
    sort: "{ createdAt: -1 }",
    scanType: stage4,
    docsExamined: q4.executionStats.totalDocsExamined,
    nReturned: q4.executionStats.nReturned,
    timeMs: q4.executionStats.executionTimeMillis,
    indexUsed: q4.queryPlanner.winningPlan?.inputStage?.indexName || "idx_submissions_created",
  });

  console.table(results);

  await closeDB();
  return results;
}

if (require.main === module) {
  runExplainAudits().catch((e) => {
    console.error("Explain audit error:", e);
    process.exit(1);
  });
}

module.exports = { runExplainAudits };
