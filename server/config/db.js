const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

const connectDB = async (maxRetries = 5, initialDelayMs = 1000) => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        maxPoolSize: 50,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
      });
      logger.info(`MongoDB Connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${attempt} of ${maxRetries} failed: ${error.message}`
      );

      if (attempt === maxRetries) {
        logger.error("Exhausted all MongoDB connection retry attempts.");
        throw error;
      }

      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 10000); // Exponential backoff capped at 10s
    }
  }
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    logger.info("MongoDB connection closed gracefully.");
  }
};

module.exports = {
  connectDB,
  closeDB,
};
