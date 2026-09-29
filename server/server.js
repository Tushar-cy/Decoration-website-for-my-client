// Sentry MUST be the very first require in the process
require("./instrument");
const { Sentry } = require("./instrument");

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const mongoose = require("mongoose");

const { env } = require("./config/env");
const { connectDB, closeDB } = require("./config/db");
const { redisClient, connectRedis, closeRedis } = require("./config/redis");
const { httpLogger, logger } = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { globalLimiter } = require("./middleware/rateLimiter");
const { requireCustomHeader } = require("./middleware/csrfMiddleware");
const AppError = require("./utils/AppError");
const featureFlags = require("./services/featureFlags");
const { razorpayBreaker } = require("./utils/circuitBreaker");

const app = express();

// 1. Trust proxy if behind Cloudflare / reverse proxy
app.set("trust proxy", 1);

// 2. HTTP Request Logger with Request IDs
app.use(httpLogger);

// 3. Security Headers via Helmet
app.use(helmet());

// 4. Response Compression
app.use(compression());

// 5. CORS with explicit allowlist (No "*", credentials true)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, health checks)
      if (!origin) return callback(null, true);

      if (env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new AppError(`Origin '${origin}' not permitted by CORS policy`, 403)
      );
    },
    credentials: true,
  })
);

// 6. Request Body Parsing
// Raw body for Razorpay Webhook signature verification
app.use("/api/payments/razorpay/webhook", express.raw({ type: "*/*" }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// 7. Cookie Parser for httpOnly JWT Tokens
app.use(cookieParser());

// 8. Data Sanitization against NoSQL Query Injection & HTTP Parameter Pollution
app.use(mongoSanitize());
app.use(hpp());

// 9. Global Rate Limiter: 120 requests/minute per IP
app.use(globalLimiter);

// 10. CSRF Protection for Cookie Auth: Require X-Requested-With: decorjoy on mutating requests
app.use(requireCustomHeader);

const { publicCache, noStoreCache } = require("./middleware/httpCache");

// 10.5. Request execution timeout: 10s limit
app.use((req, res, next) => {
  req.setTimeout(10000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        status: "error",
        message: "Gateway Timeout: Request exceeded 10s execution window",
      });
    }
  });
  next();
});

// Enable strong ETags for HTTP 304 validation
app.set("etag", "strong");

// 11. Health & Readiness Probes
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/readyz", async (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  const redisConnected = redisClient.isReady;

  const checks = {
    mongo: mongoConnected ? "connected" : "disconnected",
    redis: redisConnected ? "connected" : "bypassed",  // Redis down = bypass, not fatal
    razorpay: razorpayBreaker.state,   // CLOSED | OPEN | HALF_OPEN
  };

  if (!mongoConnected) {
    return res.status(503).set("Retry-After", "10").json({
      status: "unhealthy",
      ...checks,
      message: "MongoDB not connected",
    });
  }

  return res.status(200).json({
    status: "ready",
    ...checks,
    uptime: Math.floor(process.uptime()),
    release: process.env.SENTRY_RELEASE || "unknown",
  });
});

// Public flags endpoint (for storefront banners, payment mode)
app.get("/api/settings/flags", async (req, res) => {
  try {
    const flags = await featureFlags.get();
    // Only expose customer-facing flags — never return raw Settings
    return res.status(200).json({
      status: "success",
      data: {
        onlinePayments: flags.onlinePayments && razorpayBreaker.state !== "OPEN",
        bookingsPaused: flags.bookingsPaused,
        maintenanceBanner: flags.maintenanceBanner,
      },
    });
  } catch (err) {
    return res.status(200).json({
      status: "success",
      data: { onlinePayments: false, bookingsPaused: false, maintenanceBanner: "" },
    });
  }
});

// 12. Application API Routes

// Private, no-store transactional & auth routes
app.use("/api/auth", noStoreCache(), require("./routes/authRoutes"));
app.use("/api/quotes", noStoreCache(), require("./routes/quoteRoutes"));
app.use("/api/orders", noStoreCache(), require("./routes/orderRoutes"));
app.use("/api/payments", noStoreCache(), require("./routes/paymentRoutes"));
app.use("/api/inquiries", noStoreCache(), require("./routes/inquiryRoutes"));

// Public edge-cached routes (ETag + max-age=30, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400)
app.use("/api/services", publicCache(30, 300), require("./routes/serviceRoutes"));
app.use("/api/gallery", publicCache(30, 300), require("./routes/galleryRoutes"));
app.use("/api/testimonials", publicCache(30, 300), require("./routes/testimonialRoutes"));

// Availability has dedicated short 15s cache
app.use("/api/availability", require("./routes/availabilityRoutes"));

// Products, Categories & AddOns Routes
app.use("/api/products", publicCache(30, 300), require("./routes/productRoutes"));
app.get("/api/categories", publicCache(30, 300), require("./controllers/productController").getPublicCategories);
app.get("/api/addons", publicCache(30, 300), require("./controllers/productController").getPublicAddOns);
app.use("/api/settings", require("./routes/publicSettingsRoutes"));

// Schema-Driven Purpose Forms Routes
app.use("/api/forms", publicCache(30, 300), require("./routes/purposeFormRoutes"));

// Admin Management Routes (strictly private, no-store)
app.use("/api/admin", noStoreCache());
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/admin", require("./routes/adminProductRoutes"));
app.use("/api/admin/coupons", require("./routes/adminCouponRoutes"));
app.use("/api/admin/settings", require("./routes/adminSettingsRoutes"));
app.use("/api/admin/forms", require("./routes/adminFormRoutes"));
app.use("/api/admin/submissions", require("./routes/adminSubmissionRoutes"));
app.use("/api/admin/users", require("./routes/adminUserRoutes"));
app.use("/api/admin/audit-logs", require("./routes/adminAuditRoutes"));
app.use("/api/admin/availability", require("./routes/adminAvailabilityRoutes"));
app.use("/api/admin/gallery", require("./routes/adminGalleryRoutes"));
app.use("/api/admin/testimonials", require("./routes/adminTestimonialRoutes"));

// Root Info Route
app.get("/", (req, res) => {
  res.json({
    name: "Decor Joy Gurgaon API",
    status: "Active",
    since: 2021,
    location: "Sector 57, Gurugram, Haryana",
    endpoints: [
      "/healthz",
      "/readyz",
      "/api/auth",
      "/api/services",
      "/api/gallery",
      "/api/inquiries",
      "/api/testimonials",
    ],
  });
});

// 404 Handler
app.all("*", (req, res, next) => {
  next(new AppError(`Endpoint '${req.originalUrl}' not found on this server`, 404));
});

// 13. Centralized Error Handler
app.use(errorHandler);

// Lifecycle: Boot function
let server;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Connect to Redis
    await connectRedis();

    server = app.listen(env.PORT, () => {
      logger.info(`Decor Joy Gurgaon Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`API Base: http://localhost:${env.PORT}/api`);
    });

    // Tuning HTTP server timeouts for Cloudflare / AWS ALB reverse proxy compatibility
    server.keepAliveTimeout = 65000; // 65 seconds (must exceed reverse proxy 60s idle timeout)
    server.headersTimeout = 66000;   // 66 seconds (must exceed keepAliveTimeout)
    server.requestTimeout = 10000;   // 10 seconds request execution limit

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Draining connections and shutting down...`);
      if (server) {
        server.close(async () => {
          logger.info("HTTP server stopped accepting connections.");
          try {
            await closeDB();
            await closeRedis();
            logger.info("All database and cache handles closed cleanly.");
            process.exit(0);
          } catch (err) {
            logger.error({ err }, "Error encountered during graceful shutdown");
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }

      // Hard timeout for graceful drainage
      setTimeout(() => {
        logger.error("Forceful shutdown after drain timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    logger.error({ error }, "Failed to start Decor Joy server");
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
