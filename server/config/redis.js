const { createClient } = require("redis");
const { env } = require("./env");
const { logger } = require("../utils/logger");

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff up to 3000ms
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err) => {
  // Avoid crashing process on connection hiccups
  logger.warn({ message: err.message }, "Redis connection event");
});

redisClient.on("ready", () => {
  logger.info("Redis client connected and ready");
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.warn({ message: err.message }, "Initial Redis connection attempt failed");
  }
};

const closeRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (err) {
    logger.warn({ message: err.message }, "Error closing Redis connection");
  }
};

module.exports = {
  redisClient,
  connectRedis,
  closeRedis,
};
