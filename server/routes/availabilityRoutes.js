const express = require("express");
const { checkAvailability } = require("../controllers/availabilityController");

const router = express.Router();

// GET /api/availability?date=YYYY-MM-DD&productId=
router.get("/", checkAvailability);

module.exports = router;
