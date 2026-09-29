const express = require("express");
const { generateQuote } = require("../controllers/quoteController");

const router = express.Router();

// POST /api/quotes
router.post("/", generateQuote);

module.exports = router;
