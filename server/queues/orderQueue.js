const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

let redisConnection = null;
let notificationQueue = null;
let expiryQueue = null;

function getRedisConnection() {
  if (!redisConnection && env?.REDIS_URL) {
    try {
      redisConnection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      redisConnection.on("error", (err) => {
        logger.warn({ message: err.message }, "BullMQ Redis connection event");
      });
    } catch (err) {
      logger.warn({ err }, "Could not initialize IORedis for BullMQ");
    }
  }
  return redisConnection;
}

function getNotificationQueue() {
  if (!notificationQueue) {
    const conn = getRedisConnection();
    if (conn) {
      try {
        notificationQueue = new Queue("order-notifications", {
          connection: conn,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        });
      } catch (err) {
        logger.warn({ err }, "Could not create notificationQueue");
      }
    }
  }
  return notificationQueue;
}

function getExpiryQueue() {
  if (!expiryQueue) {
    const conn = getRedisConnection();
    if (conn) {
      try {
        expiryQueue = new Queue("order-expiry", {
          connection: conn,
          defaultJobOptions: {
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        });
      } catch (err) {
        logger.warn({ err }, "Could not create expiryQueue");
      }
    }
  }
  return expiryQueue;
}

/**
 * Enqueues a notification to be sent asynchronously by server/worker.js
 */
async function enqueueNotification(jobName, data) {
  try {
    const q = getNotificationQueue();
    if (q) {
      await q.add(jobName, data);
      logger.info({ jobName, orderId: data?.orderId }, "Enqueued notification job");
      return true;
    }
  } catch (err) {
    logger.warn({ err, jobName }, "Failed to enqueue notification job via Redis");
  }
  return false;
}

/**
 * Closes all queue handles gracefully
 */
async function closeQueues() {
  if (notificationQueue) {
    try {
      await notificationQueue.close();
    } catch (e) {}
  }
  if (expiryQueue) {
    try {
      await expiryQueue.close();
    } catch (e) {}
  }
  if (redisConnection) {
    try {
      await redisConnection.quit();
    } catch (e) {}
  }
}

module.exports = {
  getNotificationQueue,
  getExpiryQueue,
  enqueueNotification,
  closeQueues,
};
