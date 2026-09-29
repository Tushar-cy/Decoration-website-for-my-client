const express = require("express");
const {
  handleRazorpayWebhook,
  verifyPaymentCallback,
} = require("../controllers/paymentController");

const router = express.Router();

// POST /api/payments/razorpay/webhook (express.raw body)
router.post(
  "/razorpay/webhook",
  express.raw({ type: "*/*" }),
  handleRazorpayWebhook
);

// POST /api/payments/verify (browser callback signature check)
router.post("/verify", verifyPaymentCallback);

module.exports = router;
