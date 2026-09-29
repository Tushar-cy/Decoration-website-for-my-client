const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../config/db");
const { logger } = require("../utils/logger");
const Inquiry = require("../models/Inquiry");
const Submission = require("../models/Submission");

const isDryRun = process.argv.includes("--dry-run");

async function migrateInquiriesToSubmissions() {
  console.log(`Starting Inquiry -> Submission migration (Mode: ${isDryRun ? "DRY-RUN" : "LIVE"})...`);

  const inquiries = await Inquiry.find().lean();
  console.log(`Found ${inquiries.length} Inquiry documents to inspect.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const inq of inquiries) {
    // Idempotency check: see if a legacy-inquiry submission with this phone and createdAt exists
    const existing = await Submission.findOne({
      formKey: "legacy-inquiry",
      phone: inq.phone,
      createdAt: inq.createdAt,
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const answers = {
      eventType: inq.eventType,
      eventDate: inq.eventDate,
      message: inq.message || "",
    };

    const answersSnapshot = [
      {
        fieldId: "eventType",
        label: "Event Type",
        value: inq.eventType,
        group: "General",
      },
      {
        fieldId: "eventDate",
        label: "Event Date",
        value: inq.eventDate,
        group: "General",
      },
      {
        fieldId: "message",
        label: "Message / Requirements",
        value: inq.message || "",
        group: "General",
      },
    ];

    let mappedStatus = "new";
    if (inq.status === "contacted") mappedStatus = "contacted";
    if (inq.status === "completed") mappedStatus = "converted";

    const submissionData = {
      formKey: "legacy-inquiry",
      formVersion: 1,
      answers,
      answersSnapshot,
      name: inq.name,
      phone: inq.phone,
      email: inq.email || "",
      status: mappedStatus,
      createdAt: inq.createdAt,
      updatedAt: inq.updatedAt,
    };

    if (isDryRun) {
      console.log(`[DRY-RUN] Would create Submission for inquiry from ${inq.name} (${inq.phone})`);
    } else {
      await Submission.create(submissionData);
    }
    createdCount++;
  }

  console.log("\n==========================================");
  console.log("Migration Summary:");
  console.log(`- Total Inquiries: ${inquiries.length}`);
  console.log(`- New Submissions ${isDryRun ? "to create" : "created"}: ${createdCount}`);
  console.log(`- Already migrated / skipped: ${skippedCount}`);
  console.log("==========================================\n");

  return { total: inquiries.length, created: createdCount, skipped: skippedCount };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await migrateInquiriesToSubmissions();
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error("Migration error:", err);
      process.exit(1);
    }
  })();
}

module.exports = {
  migrateInquiriesToSubmissions,
};
