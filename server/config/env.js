const dotenv = require("dotenv");
const { z } = require("zod");

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string({
    error: "MONGO_URI is required",
  }).min(1, "MONGO_URI cannot be empty"),
  JWT_ACCESS_SECRET: z.string({
    error: "JWT_ACCESS_SECRET is required",
  }).min(32, "JWT_ACCESS_SECRET must be at least 32 characters long"),
  JWT_REFRESH_SECRET: z.string({
    error: "JWT_REFRESH_SECRET is required",
  }).min(32, "JWT_REFRESH_SECRET must be at least 32 characters long"),
  CLIENT_URL: z.string({
    error: "CLIENT_URL is required",
  }).min(1, "CLIENT_URL cannot be empty"),
  REDIS_URL: z.string({
    error: "REDIS_URL is required",
  }).min(1, "REDIS_URL cannot be empty"),

  // Optional third-party configurations
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Optional admin seed credentials
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12, "ADMIN_PASSWORD must be at least 12 characters").optional(),
});

function validateEnv(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error("❌ Invalid environment variables configuration:\n" + issues);
    if (rawEnv.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw new Error("Invalid environment variables:\n" + issues);
  }

  const parsed = result.data;
  const clientOrigins = parsed.CLIENT_URL.split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return {
    ...parsed,
    clientOrigins,
  };
}

let env;
try {
  env = validateEnv(process.env);
} catch (error) {
  if (process.env.NODE_ENV === "test") {
    // In test harness, env can be reloaded/mocked
    env = null;
  } else {
    process.exit(1);
  }
}

module.exports = {
  env,
  validateEnv,
};
