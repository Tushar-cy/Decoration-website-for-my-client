/**
 * client/src/sentry.js
 * Client-side Sentry initialization.
 * Import this as the FIRST import in main.jsx.
 */
import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const RELEASE = import.meta.env.VITE_SENTRY_RELEASE;
const ENVIRONMENT = import.meta.env.VITE_SENTRY_ENV || import.meta.env.MODE;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: RELEASE,
    environment: ENVIRONMENT,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Only capture session replays when an error occurs
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === "production" ? 0.05 : 1.0,

    // Session replays: capture 0% of sessions, 100% of error sessions
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // PII scrubbing
    beforeSend(event) {
      // Strip phone numbers and emails from breadcrumbs and data
      scrubEvent(event);
      return event;
    },

    // Do not capture these as Sentry issues
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      /^Network Error$/,
      /^Load failed$/,
      /ChunkLoadError/,
    ],
  });
}

const PHONE_RE = /(\+?\d[\d\s\-()]{7,}\d)/g;
const EMAIL_RE = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;

function scrubString(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(PHONE_RE, "[PHONE_REDACTED]")
    .replace(EMAIL_RE, "[EMAIL_REDACTED]");
}

function scrubEvent(event) {
  if (event.request?.data) {
    try {
      const data = typeof event.request.data === "string"
        ? JSON.parse(event.request.data)
        : event.request.data;
      walkAndScrub(data);
    } catch { /* ignored */ }
  }
  if (event.breadcrumbs?.values) {
    event.breadcrumbs.values.forEach((b) => {
      if (b.message) b.message = scrubString(b.message);
      if (b.data?.url) b.data.url = scrubString(b.data.url);
    });
  }
}

function walkAndScrub(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      obj[key] = scrubString(obj[key]);
    } else if (typeof obj[key] === "object") {
      walkAndScrub(obj[key]);
    }
  }
}

export { Sentry };
