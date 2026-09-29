/**
 * Migration: add_publicId_isFeatured_to_gallery
 *
 * EXPAND phase.
 * Adds publicId (Cloudinary asset ID) and isFeatured fields to existing Gallery docs.
 * Old code is safe — it ignores unknown fields.
 */

module.exports = {
  async up(db) {
    await db.collection("galleries").updateMany(
      { publicId: { $exists: false } },
      { $set: { publicId: "", isFeatured: false } }
    );
    // Create new index on { isFeatured, isActive }
    await db.collection("galleries").createIndex(
      { isFeatured: 1, isActive: 1 },
      { background: true, name: "isFeatured_isActive" }
    );
    console.log("✅ add_publicId_isFeatured_to_gallery: fields added and index created");
  },

  async down(db) {
    await db.collection("galleries").updateMany(
      {},
      { $unset: { publicId: "", isFeatured: "" } }
    );
    await db.collection("galleries").dropIndex("isFeatured_isActive").catch(() => {});
    console.log("↩️  add_publicId_isFeatured_to_gallery: rollback complete");
  },
};
