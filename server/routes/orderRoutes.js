const express = require("express");
const { createOrder, trackOrder, getOrderByNumber } = require("../controllers/orderController");
const { trackOrderLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/orders/track?orderNumber=&phone= (Rate limit 10/min)
router.get("/track", trackOrderLimiter, trackOrder);
router.get("/:orderNumber", trackOrderLimiter, getOrderByNumber);

// POST /api/orders (Requires Idempotency-Key header)
router.post("/", createOrder);

module.exports = router;
