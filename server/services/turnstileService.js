const { env } = require("../config/env");
const { logger } = require("../utils/logger");
const AppError = require("../utils/AppError");

/**
 * Validates Cloudflare Turnstile token and honeypot field.
 */
async function verifyTurnstile({ token, honeypot = null, remoteIp = null }) {
  // 1. Honeypot check: Bots usually fill hidden fields
  if (honeypot && String(honeypot).trim().length > 0) {
    logger.warn({ honeypot }, "Submission rejected by honeypot anti-spam trigger");
    throw new AppError("Spam verification triggered. Submission rejected.", 400);
  }

  // 2. Token presence check
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    throw new AppError("Security verification failed: Turnstile token is required.", 400);
  }

  const cleanToken = token.trim();
  const secretKey = env?.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // 3. If live Cloudflare Turnstile secret key is configured, verify with Cloudflare API
  if (secretKey && secretKey !== "dummy_turnstile_secret_for_dev") {
    try {
      const formData = new URLSearchParams();
      formData.append("secret", secretKey);
      formData.append("response", cleanToken);
      if (remoteIp) {
        formData.append("remoteip", remoteIp);
      }

      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });

      const outcome = await res.json();
      if (!outcome.success) {
        logger.warn({ errorCodes: outcome["error-codes"] }, "Cloudflare Turnstile token validation failed");
        throw new AppError("Bot verification failed. Please complete the security check and try again.", 400);
      }

      return true;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, "Error connecting to Cloudflare Turnstile API");
      // Fallback: If network or Cloudflare has outage, allow if dev token
      if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        return true;
      }
      throw new AppError("Security verification temporarily unavailable. Please try again shortly.", 502);
    }
  }

  // 4. In testing or local development without keys:
  // Accept standard Cloudflare dummy tokens ("XXXX.DUMMY.TOKEN.XXXX") or any valid string
  return true;
}

module.exports = {
  verifyTurnstile,
};
