const { z } = require("zod");
const Order = require("../models/Order");
const {
  verifyWebhookSignature,
  verifyPaymentSignature,
} = require("../services/razorpayService");
const { enqueueNotification } = require("../queues/orderQueue");
const { redisClient } = require("../config/redis");
const { logger } = require("../utils/logger");
const AppError = require("../utils/AppError");

// In-memory set for event deduplication fallback
const processedEvents = new Set();

/**
 * Checks if an event ID has already been processed to guarantee idempotency.
 */
async function isEventProcessed(eventId) {
  if (!eventId) return false;

  if (redisClient.isReady) {
    try {
      const exists = await redisClient.get(`rzp:event:${eventId}`);
      if (exists) return true;
    } catch (e) {}
  }

  return processedEvents.has(eventId);
}

/**
 * Marks an event ID as processed with a 24-hour expiration.
 */
async function markEventProcessed(eventId) {
  if (!eventId) return;

  processedEvents.add(eventId);
  // Keep set from unbounded growth
  if (processedEvents.size > 10000) {
    const firstItem = processedEvents.values().next().value;
    processedEvents.delete(firstItem);
  }

  if (redisClient.isReady) {
    try {
      await redisClient.set(`rzp:event:${eventId}`, "1", { EX: 86400 });
    } catch (e) {}
  }
}

/**
 * POST /api/payments/razorpay/webhook
 * Receives raw body buffer from express.raw.
 * Verifies signature, dedupes by event id, updates payment and confirms order.
 * Single source of truth for payment confirmations.
 */
async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      throw new AppError("Missing x-razorpay-signature header", 400);
    }

    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody) && typeof rawBody !== "string") {
      throw new AppError("Raw request body buffer required for webhook verification", 400);
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn("Razorpay webhook signature verification failed");
      throw new AppError("Invalid webhook signature", 400);
    }

    const payloadString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const event = JSON.parse(payloadString);

    const eventId = event.event_id || event.id || (event.payload?.payment?.entity?.id ? `${event.event}_${event.payload.payment.entity.id}` : null);

    // 1. Dedupe by event id
    if (eventId && (await isEventProcessed(eventId))) {
      logger.info({ eventId }, "Duplicate webhook event ignored");
      return res.status(200).json({ status: "ok", duplicate: true });
    }

    const eventName = event.event;
    logger.info({ eventName, eventId }, "Processing Razorpay webhook event");

    // 2. Handle payment capture or order paid
    if (eventName === "payment.captured" || eventName === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const paidAmountPaise = paymentEntity?.amount;

      if (razorpayOrderId) {
        const order = await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId });

        if (order) {
          const wasPending = order.status === "pending";

          order.payment.status = "advance_paid";
          if (razorpayPaymentId) {
            order.payment.razorpayPaymentId = razorpayPaymentId;
          }
          if (paidAmountPaise) {
            order.payment.paidPaise = paidAmountPaise;
          }

          if (wasPending) {
            order.status = "confirmed";
            order.statusHistory.push({
              status: "confirmed",
              at: new Date(),
              by: "razorpay_webhook",
              note: `Advance payment verified via Razorpay webhook. Payment ID: ${razorpayPaymentId || "N/A"}`,
            });

            await order.save();
            logger.info({ orderNumber: order.orderNumber }, "Order transitioned pending -> confirmed via webhook");

            await enqueueNotification("ORDER_CONFIRMED", {
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              customerPhone: order.customerSnapshot?.phone,
              customerEmail: order.customerSnapshot?.email,
              totalPaise: order.pricing.totalPaise,
            });
          } else {
            await order.save();
          }
        } else {
          logger.warn({ razorpayOrderId }, "No local order found for Razorpay order ID in webhook");
        }
      }
    }

    if (eventId) {
      await markEventProcessed(eventId);
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
}

const verifyBodySchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
  orderNumber: z.string().optional(),
});

/**
 * POST /api/payments/verify
 * Browser callback verification.
 * Performs HMAC signature check only; does not confirm the order by itself.
 */
async function verifyPaymentCallback(req, res, next) {
  try {
    const validated = verifyBodySchema.parse(req.body);

    const isValid = verifyPaymentSignature({
      razorpay_order_id: validated.razorpay_order_id,
      razorpay_payment_id: validated.razorpay_payment_id,
      razorpay_signature: validated.razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature verification",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment signature verified successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleRazorpayWebhook,
  verifyPaymentCallback,
  isEventProcessed,
  markEventProcessed,
};
