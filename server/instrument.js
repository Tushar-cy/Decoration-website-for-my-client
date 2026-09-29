/**
 * server/instrument.js
 * Sentry server-side instrumentation.
 * Must be imported FIRST in server.js before any other modules.
 *
 * Loaded via: node --import ./instrument.js server.js
 * or require('./instrument') as the first line of server.js
 */
const Sentry = require("@sentry/node");

const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || "development";
const RELEASE = process.env.SENTRY_RELEASE || process.env.npm_package_version || "unknown";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    release: RELEASE,
    tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,

    // PII scrubbing: strip phone numbers and emails from all events
    beforeSend(event) {
      scrubPII(event);
      return event;
    },

    // Don't capture 4xx operational errors as Sentry issues
    ignoreErrors: [
      /not found/i,
      /unauthorized/i,
      /forbidden/i,
      /validation failed/i,
      /duplicate value/i,
    ],
  });
}

/**
 * Redacts phone numbers and email addresses from Sentry event payloads
 * to comply with PII / PDPA rules.
 */
function scrubPII(event) {
  const PHONE_RE = /(\+?\d[\d\s\-()]{7,}\d)/g;
  const EMAIL_RE = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;

  function redactString(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(PHONE_RE, "[PHONE_REDACTED]")
      .replace(EMAIL_RE, "[EMAIL_REDACTED]");
  }

  function walkAndRedact(obj) {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string") {
        obj[key] = redactString(obj[key]);
      } else if (typeof obj[key] === "object") {
        walkAndRedact(obj[key]);
      }
    }
  }

  if (event.request?.data) walkAndRedact(event.request.data);
  if (event.extra) walkAndRedact(event.extra);
  if (event.contexts) walkAndRedact(event.contexts);
}

module.exports = { Sentry };
