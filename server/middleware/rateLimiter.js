const { rateLimit, MemoryStore } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("../config/redis");

class ResilientStore {
  constructor(prefix) {
    this.memoryStore = new MemoryStore();
    this.redisStore = new RedisStore({
      sendCommand: async (...args) => {
        if (!redisClient.isReady) {
          return "";
        }
        return redisClient.sendCommand(args);
      },
      prefix,
    });
  }

  init(options) {
    this.options = options;
    if (this.memoryStore.init) this.memoryStore.init(options);
    if (this.redisStore.init) this.redisStore.init(options);
  }

  async increment(key) {
    if (redisClient.isReady) {
      try {
        return await this.redisStore.increment(key);
      } catch (err) {
        // Fallback to in-memory store if Redis command fails
      }
    }
    return await this.memoryStore.increment(key);
  }

  async decrement(key) {
    if (redisClient.isReady) {
      try {
        return await this.redisStore.decrement(key);
      } catch (err) {}
    }
    return await this.memoryStore.decrement(key);
  }

  async resetKey(key) {
    if (redisClient.isReady) {
      try {
        return await this.redisStore.resetKey(key);
      } catch (err) {}
    }
    return await this.memoryStore.resetKey(key);
  }

  async resetAll() {
    if (this.memoryStore.resetAll) {
      await this.memoryStore.resetAll();
    }
    if (this.redisStore.resetAll && redisClient.isReady) {
      try {
        await this.redisStore.resetAll();
      } catch (err) {}
    }
  }
}

// 1. Global Rate Limiter: 120 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientStore("rl:global:"),
  message: {
    message: "Too many requests from this IP, please try again after a minute",
  },
});

// 2. Inquiry Rate Limiter: 5 requests per minute on POST /api/inquiries
const inquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientStore("rl:inquiry:"),
  message: {
    message: "Too many inquiries submitted from this IP, please try again after a minute",
  },
});

// 3. Login Rate Limiter: 10 requests per 15 minutes on POST /api/auth/login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientStore("rl:login:"),
  message: {
    message: "Too many login attempts from this IP, please try again in 15 minutes",
  },
});

// 4. Track Order Rate Limiter: 10 requests per minute on GET /api/orders/track
const trackOrderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientStore("rl:track:"),
  message: {
    message: "Too many tracking lookups from this IP, please try again after a minute",
  },
});

module.exports = {
  globalLimiter,
  inquiryLimiter,
  loginLimiter,
  trackOrderLimiter,
};
