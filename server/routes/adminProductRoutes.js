const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  restoreAdminProduct,
  duplicateAdminProduct,
  bulkUpdateProductStatus,
  getUploadSignature,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  restoreAddOn,
} = require("../controllers/adminProductController");

const router = express.Router();

router.use(protect);

// Upload signature
router.post("/uploads/signature", getUploadSignature);

// Products
router.get("/products", getAdminProducts);
router.get("/products/:id", getAdminProductById);
router.post("/products", createAdminProduct);
router.put("/products/:id", updateAdminProduct);
router.delete("/products/:id", authorize("owner"), deleteAdminProduct);
router.post("/products/:id/restore", restoreAdminProduct);
router.post("/products/:id/duplicate", duplicateAdminProduct);
router.patch("/products/bulk-status", bulkUpdateProductStatus);

// Categories
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", authorize("owner"), deleteCategory);
router.post("/categories/:id/restore", restoreCategory);

// AddOns
router.post("/addons", createAddOn);
router.put("/addons/:id", updateAddOn);
router.delete("/addons/:id", authorize("owner"), deleteAddOn);
router.post("/addons/:id/restore", restoreAddOn);

module.exports = router;
