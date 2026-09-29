const express = require("express");
const {
  getPublicProducts,
  getProductBySlug,
  getPublicCategories,
  getPublicAddOns,
} = require("../controllers/productController");

const router = express.Router();

// GET /api/products
router.get("/", getPublicProducts);

// GET /api/products/:slug
router.get("/:slug", getProductBySlug);

module.exports = router;
