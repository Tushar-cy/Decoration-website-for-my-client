const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { env } = require("./config/env");
const { connectDB, closeDB } = require("./config/db");
const { logger } = require("./utils/logger");
const Order = require("./models/Order");
const Settings = require("./models/Settings");
const { releaseSlotAtomic } = require("./services/slotService");
const { recordAudit } = require("./services/auditService");

/**
 * Sweeps the database for pending unpaid orders older than 15 minutes,
 * cancels them, and releases their reserved slots.
 */
async function cancelExpiredOrders() {
  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

  try {
    const expiredOrders = await Order.find({
      status: "pending",
      "payment.status": "unpaid",
      createdAt: { $lte: cutoffTime },
    });

    if (expiredOrders.length === 0) {
      return { cancelledCount: 0 };
    }

    logger.info({ count: expiredOrders.length }, "Found expired unpaid orders to auto-cancel");

    let count = 0;
    for (const order of expiredOrders) {
      const prevStatus = order.status;
      order.status = "cancelled";
      order.statusHistory.push({
        status: "cancelled",
        at: new Date(),
        by: "system_worker",
        note: "Auto-cancelled: Unpaid after 15 minutes expiry window",
      });

      await order.save();

      // Compensating action: Release reserved slot
      if (order.event?.date && order.event?.slotKey) {
        await releaseSlotAtomic({
          date: order.event.date,
          slotKey: order.event.slotKey,
        });
      }

      await recordAudit({
        actorId: "system_worker",
        action: "ORDER_AUTO_EXPIRED",
        entity: "Order",
        entityId: order._id,
        before: { status: prevStatus },
        after: { status: "cancelled" },
        ip: "127.0.0.1",
      });

      count++;
      logger.info({ orderNumber: order.orderNumber }, "Auto-cancelled expired order and released slot");
    }

    return { cancelledCount: count };
  } catch (err) {
    logger.error({ err }, "Error running cancelExpiredOrders sweep");
    throw err;
  }
}

/**
 * Handles sending simulated or real notifications (email, SMS, WhatsApp)
 * from the worker process instead of inline in HTTP request loops.
 */
async function processNotificationJob(job) {
  const { name, data } = job;
  const { orderId, orderNumber, customerEmail, customerPhone, totalPaise } = data || {};

  logger.info({ jobName: name, orderNumber }, "Processing background notification job");

  switch (name) {
    case "ORDER_CREATED":
      logger.info(
        { orderNumber, customerPhone, customerEmail },
        `[EMAIL/SMS] New Order ${orderNumber} placed for ₹${((totalPaise || 0) / 100).toFixed(2)}. Sent to customer & owner.`
      );
      break;

    case "ORDER_CONFIRMED":
      logger.info(
        { orderNumber, customerPhone, customerEmail },
        `[EMAIL/SMS] Payment confirmed for Order ${orderNumber}. Booking confirmed!`
      );
      break;

    case "ORDER_CANCELLED":
      logger.info(
        { orderNumber, customerEmail },
        `[EMAIL/SMS] Cancellation notice sent for Order ${orderNumber}.`
      );
      break;

    default:
      logger.warn({ jobName: name }, "Unknown notification job type");
  }

  return { delivered: true, jobName: name, at: new Date() };
}

let notificationWorker = null;
let sweepInterval = null;

async function startWorker() {
  logger.info("Starting Decor Joy background worker...");

  await connectDB();

  const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  try {
    await redisConnection.connect();
    logger.info("Worker connected to Redis");
  } catch (e) {
    logger.warn({ message: e.message }, "Worker running with Redis reconnect mode");
  }

  // BullMQ Worker for background notifications
  notificationWorker = new Worker(
    "order-notifications",
    async (job) => processNotificationJob(job),
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  notificationWorker.on("completed", (job) => {
    logger.debug({ jobId: job.id, name: job.name }, "Notification job completed");
  });

  notificationWorker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Notification job failed");
  });

  // Run initial expiry sweep, then schedule every 60 seconds
  await cancelExpiredOrders();
  sweepInterval = setInterval(async () => {
    try {
      await cancelExpiredOrders();
    } catch (e) {}
  }, 60 * 1000);

  const shutdown = async (signal) => {
    logger.info(`Worker received ${signal}. Shutting down cleanly...`);
    if (sweepInterval) clearInterval(sweepInterval);
    if (notificationWorker) await notificationWorker.close();
    await redisConnection.quit();
    await closeDB();
    logger.info("Worker stopped.");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.info("Decor Joy background worker is active and listening for jobs.");
}

if (require.main === module) {
  startWorker().catch((err) => {
    logger.error({ err }, "Fatal error starting worker");
    process.exit(1);
  });
}

module.exports = {
  startWorker,
  cancelExpiredOrders,
  processNotificationJob,
};
