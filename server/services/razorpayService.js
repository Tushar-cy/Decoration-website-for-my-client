const crypto = require("crypto");
const Razorpay = require("razorpay");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");
const AppError = require("../utils/AppError");
const { razorpayBreaker } = require("../utils/circuitBreaker");

let razorpayClient = null;

if (env?.RAZORPAY_KEY_ID && env?.RAZORPAY_KEY_SECRET) {
  try {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    logger.warn({ err }, "Could not initialize live Razorpay client");
  }
}

/**
 * Creates an order on Razorpay for online advance payment.
 * Amount is in paise as integer.
 */
async function createRazorpayOrder({ amountPaise, receipt, notes = {} }) {
  if (!amountPaise || amountPaise <= 0) {
    return null;
  }

  // If live Razorpay client is initialized, call Razorpay API protected by circuit breaker
  if (razorpayClient) {
    return await razorpayBreaker.execute(
      async () => {
        const order = await razorpayClient.orders.create({
          amount: Math.round(amountPaise),
          currency: "INR",
          receipt: String(receipt).slice(0, 40),
          notes,
        });
        return order.id;
      },
      { maxRetries: 2, timeoutMs: 6000, baseDelayMs: 250 }
    );
  }

  // Mock implementation for development/testing when keys are not configured
  const mockId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  logger.info({ mockId, amountPaise, receipt }, "Generated mock Razorpay order ID");
  return mockId;
}

/**
 * Verifies Razorpay checkout browser callback signature:
 * hmac_sha256(order_id + "|" + payment_id, secret) == signature
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const secret = env?.RAZORPAY_KEY_SECRET || "mock_razorpay_secret_key_for_testing";
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const bufExpected = Buffer.from(expectedSignature);
  const bufActual = Buffer.from(razorpay_signature);
  if (bufExpected.length !== bufActual.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufExpected, bufActual);
}

/**
 * Verifies Razorpay webhook signature from raw request buffer:
 * hmac_sha256(rawBody, webhookSecret) == x-razorpay-signature
 */
function verifyWebhookSignature(rawBody, signature, customSecret = null) {
  if (!rawBody || !signature) {
    return false;
  }

  const secret = customSecret || env?.RAZORPAY_WEBHOOK_SECRET || env?.RAZORPAY_KEY_SECRET || "mock_webhook_secret";

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    const bufExpected = Buffer.from(expectedSignature);
    const bufActual = Buffer.from(signature);
    if (bufExpected.length !== bufActual.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufExpected, bufActual);
  } catch (err) {
    return false;
  }
}

/**
 * Issues a full or partial refund via Razorpay.
 */
async function issueRefund({ paymentId, amountPaise, notes = {} }) {
  if (!paymentId) {
    throw new AppError("Payment ID is required to process refund", 400);
  }

  if (razorpayClient) {
    return await razorpayBreaker.execute(
      async () => {
        const options = { notes };
        if (amountPaise && amountPaise > 0) {
          options.amount = Math.round(amountPaise);
        }
        return await razorpayClient.payments.refund(paymentId, options);
      },
      { maxRetries: 1, timeoutMs: 8000, baseDelayMs: 500 }
    );
  }

  // Mock refund response
  return {
    id: `rfnd_mock_${Date.now()}`,
    payment_id: paymentId,
    amount: amountPaise,
    status: "processed",
  };
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  issueRefund,
};
