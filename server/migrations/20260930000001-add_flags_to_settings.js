/**
 * Migration: add_flags_to_settings
 *
 * EXPAND phase of expand/contract pattern.
 * Adds the `flags` subdocument to the singleton Settings document.
 * Safe to run while the previous version is still deployed — the old code
 * simply ignores the new field.
 *
 * Contract (removal of old fields) handled in a future migration once all
 * instances are running the new version.
 */

module.exports = {
  async up(db) {
    await db.collection("settings").updateMany(
      { flags: { $exists: false } },
      {
        $set: {
          "flags.onlinePayments": true,
          "flags.bookingsPaused": false,
          "flags.maintenanceBanner": "",
        },
      }
    );
    console.log("✅ add_flags_to_settings: flags sub-document added to all Settings docs");
  },

  async down(db) {
    // Contract: remove flags on rollback
    await db.collection("settings").updateMany(
      {},
      { $unset: { flags: "" } }
    );
    console.log("↩️  add_flags_to_settings: flags sub-document removed (rollback)");
  },
};
