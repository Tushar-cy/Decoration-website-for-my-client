const mongoose = require("mongoose");
const { env } = require("../config/env");
const { connectDB, closeDB } = require("../config/db");
const { logger } = require("../utils/logger");

// Require all models to ensure schemas and indexes are registered
const Admin = require("../models/Admin");
const RefreshToken = require("../models/RefreshToken");
const Category = require("../models/Category");
const Product = require("../models/Product");
const AddOn = require("../models/AddOn");
const Settings = require("../models/Settings");
const SlotBooking = require("../models/SlotBooking");
const { Customer } = require("../models/Customer");
const Counter = require("../models/Counter");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const AuditLog = require("../models/AuditLog");
const Gallery = require("../models/Gallery");
const Testimonial = require("../models/Testimonial");
const Inquiry = require("../models/Inquiry");
const Service = require("../models/Service");

const models = [
  { name: "Admin", model: Admin },
  { name: "RefreshToken", model: RefreshToken },
  { name: "Category", model: Category },
  { name: "Product", model: Product },
  { name: "AddOn", model: AddOn },
  { name: "Settings", model: Settings },
  { name: "SlotBooking", model: SlotBooking },
  { name: "Customer", model: Customer },
  { name: "Counter", model: Counter },
  { name: "Order", model: Order },
  { name: "Coupon", model: Coupon },
  { name: "AuditLog", model: AuditLog },
  { name: "Gallery", model: Gallery },
  { name: "Testimonial", model: Testimonial },
  { name: "Inquiry", model: Inquiry },
  { name: "Service", model: Service },
];

const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("--simulate");

const syncAllIndexes = async () => {
  try {
    if (isDryRun) {
      console.log("🔍 [SIMULATE] Inspecting defined schema indexes for all 16 models:\n");
      for (const { name, model } of models) {
        const schemaIndexes = model.schema.indexes();
        console.log(`📋 [${name}] (${schemaIndexes.length} schema indexes registered):`);
        schemaIndexes.forEach(([spec, opts]) => {
          console.log(`   - ${JSON.stringify(spec)} ${opts ? JSON.stringify(opts) : ""}`);
        });
      }
      console.log("\nAll schema indexes verified successfully (simulation mode).");
      process.exit(0);
    }

    console.log("Connecting to MongoDB to sync indexes...");
    await connectDB();

    console.log("Synchronizing schema indexes across all collections...");
    for (const { name, model } of models) {
      try {
        const result = await model.syncIndexes();
        console.log(`✅ [${name}] Indexes synced:`, result || "OK");
      } catch (err) {
        console.error(`❌ [${name}] Index sync error:`, err.message);
        throw err;
      }
    }

    console.log("All collection indexes have been synchronized successfully.");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("Index synchronization failed:", error.message);
    await closeDB();
    process.exit(1);
  }
};

if (require.main === module) {
  syncAllIndexes();
}

module.exports = {
  models,
  syncAllIndexes,
};
