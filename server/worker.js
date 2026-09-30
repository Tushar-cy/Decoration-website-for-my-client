const { Worker, Queue } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { env } = require("./config/env");
const { connectDB, closeDB } = require("./config/db");
const { connectRedis, closeRedis } = require("./config/redis");
const { logger } = require("./utils/logger");
const Order = require("./models/Order");
const Settings = require("./models/Settings");
const Category = require("./models/Category");
const Product = require("./models/Product");
const FormSchema = require("./models/FormSchema");
const cache = require("./utils/cache");
const { releaseSlotAtomic } = require("./services/slotService");
const { recordAudit } = require("./services/auditService");
const whatsappService = require("./services/whatsappService");

/**
 * Sweeps for orders whose event slot ended >= 2 hours ago and sends
 * Google review requests to customers via WhatsApp.
 */
async function sendReviewRequestsSweep() {
  try {
    const settings = await Settings.getSettings();
    const googleReviewUrl =
      settings.business?.googleReviewUrl || "https://g.page/r/decorjoygurgaon/review";
    const slotConfigs = settings.slots || [];
    const slotMap = new Map(slotConfigs.map((s) => [s.key, s.endTime]));

    // Find orders eligible for review trigger:
    // Event date is today or past (within last 7 days), status confirmed/completed/scheduled, reviewPromptSentAt is null
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const orders = await Order.find({
      status: { $in: ["confirmed", "completed", "scheduled"] },
      reviewPromptSentAt: null,
      "event.date": { $gte: sevenDaysAgo, $lte: now },
    }).lean();

    let sentCount = 0;
    for (const order of orders) {
      const slotKey = order.event?.slotKey;
      const rawEndTime = slotMap.get(slotKey) || "18:00";
      const [endH, endM] = rawEndTime.split(":").map(Number);

      // Event date converted to IST slot end timestamp
      const eventDate = new Date(order.event.date);
      // IST is UTC + 5:30. To convert IST hour:min to UTC:
      const slotEndUtc = new Date(
        Date.UTC(
          eventDate.getUTCFullYear(),
          eventDate.getUTCMonth(),
          eventDate.getUTCDate(),
          endH - 5,
          endM - 30,
          0,
          0
        )
      );

      // Trigger condition: 2 hours after slot ended
      const triggerTime = new Date(slotEndUtc.getTime() + 2 * 60 * 60 * 1000);

      if (now >= triggerTime) {
        const updated = await Order.findOneAndUpdate(
          { _id: order._id, reviewPromptSentAt: null },
          { $set: { reviewPromptSentAt: new Date() } }
        );

        if (updated) {
          await whatsappService.sendReviewRequest({
            customerPhone: order.customerSnapshot?.phone,
            customerName: order.customerSnapshot?.name,
            orderNumber: order.orderNumber,
            googleReviewUrl,
          });
          sentCount++;
          logger.info(
            { orderNumber: order.orderNumber, phone: order.customerSnapshot?.phone },
            "Sent automated Google review request 2h post-slot"
          );
        }
      }
    }

    return { sentCount };
  } catch (err) {
    logger.warn({ err: err.message }, "Error during sendReviewRequestsSweep");
    return { sentCount: 0 };
  }
}

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
 * Warms up Redis cache with hot catalog, settings, and form data.
 */
async function warmUpCache() {
  logger.info("Running cache warmup job...");
  try {
    // 1. Categories
    await cache.wrap(
      cache.buildCacheKey("categories", {}),
      600,
      async () =>
        Category.find({ isActive: true, deletedAt: null })
          .select("name slug image sortOrder isActive")
          .sort({ sortOrder: 1, name: 1 })
          .lean(),
      { tags: ["categories"], forceFresh: true }
    );

    // 2. Public Settings
    await cache.wrap(
      "cache:settings:public",
      600,
      async () => {
        const settings = await Settings.getSettings();
        return {
          business: {
            name: settings.business?.name || "Decor Joy Gurgaon",
            phone: settings.business?.phone || "+91 7015767715",
            whatsapp: settings.business?.whatsapp || "+91 7015767715",
            email: settings.business?.email || "decorjoygurgaon@gmail.com",
            address: settings.business?.address || "Sector 57, Gurugram, Haryana",
            geo: settings.business?.geo || { lat: 28.4239, lng: 77.0863 },
          },
          slots: (settings.slots || []).map((s) => ({
            key: s.key,
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          serviceablePincodes: (settings.serviceablePincodes || []).map((p) => ({
            pincode: p.pincode,
            deliveryFeePaise: p.deliveryFeePaise,
          })),
          advancePercent: settings.advancePercent || 25,
          paymentMode: settings.paymentMode || "advance_online",
          socials: settings.socials || {},
        };
      },
      { tags: ["settings"], forceFresh: true }
    );

    // 3. Active purpose forms
    await cache.wrap(
      "cache:forms:active",
      600,
      async () => {
        const forms = await FormSchema.find({ isActive: true })
          .select("key title description version fields successMessage")
          .lean();
        return forms.map((f) => ({
          key: f.key,
          title: f.title,
          description: f.description,
          version: f.version,
          fieldCount: (f.fields || []).length,
        }));
      },
      { tags: ["forms"], forceFresh: true }
    );

    // 4. Products catalogue page 1
    await cache.wrap(
      cache.buildCacheKey("products", {}),
      120,
      async () => {
        const [products, total] = await Promise.all([
          Product.find({ isActive: true, deletedAt: null })
            .select(
              "title slug categoryId basePricePaise compareAtPricePaise images badge isFeatured ratingAvg ratingCount setupMinutes minLeadHours tags isActive sortOrder"
            )
            .populate("categoryId", "name slug")
            .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
            .limit(20)
            .lean(),
          Product.countDocuments({ isActive: true, deletedAt: null }),
        ]);

        return {
          products,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20) || 1,
          },
        };
      },
      { tags: ["products"], forceFresh: true }
    );

    logger.info("Cache warmup successfully populated hot catalog and config entries in Redis.");
  } catch (err) {
    logger.warn({ err: err.message }, "Cache warmup failed to refresh some keys");
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

    case "CACHE_WARMUP":
      await warmUpCache();
      break;

    default:
      logger.warn({ jobName: name }, "Unknown notification job type");
  }

  return { delivered: true, jobName: name, at: new Date() };
}

let notificationWorker = null;
let sweepInterval = null;
let warmupInterval = null;
let reviewInterval = null;

async function startWorker() {
  logger.info("Starting Decor Joy background worker (BullMQ + Slot Expiry + Cache Warmup)...");

  await connectDB();
  await connectRedis();

  const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  try {
    await redisConnection.connect();
    logger.info("Worker connected to Redis for BullMQ");
  } catch (e) {
    logger.warn({ message: e.message }, "Worker running with Redis reconnect mode");
  }

  // BullMQ Worker for background notifications and scheduled jobs
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

  // 1. Initial orders sweep and recurring interval (60s)
  await cancelExpiredOrders();
  sweepInterval = setInterval(async () => {
    try {
      await cancelExpiredOrders();
    } catch (e) {}
  }, 60 * 1000);

  // 2. Initial cache warmup and recurring interval (10 min)
  await warmUpCache();
  warmupInterval = setInterval(async () => {
    try {
      await warmUpCache();
    } catch (e) {}
  }, 10 * 60 * 1000);

  // 3. Local Google review collection sweep: every 15 minutes
  await sendReviewRequestsSweep();
  reviewInterval = setInterval(async () => {
    try {
      await sendReviewRequestsSweep();
    } catch (e) {}
  }, 15 * 60 * 1000);

  const shutdown = async (signal) => {
    logger.info(`Worker received ${signal}. Shutting down cleanly...`);
    if (sweepInterval) clearInterval(sweepInterval);
    if (warmupInterval) clearInterval(warmupInterval);
    if (reviewInterval) clearInterval(reviewInterval);
    if (notificationWorker) await notificationWorker.close();
    await redisConnection.quit();
    await closeRedis();
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
  warmUpCache,
  processNotificationJob,
  sendReviewRequestsSweep,
};
