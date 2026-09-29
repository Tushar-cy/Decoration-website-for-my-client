/**
 * Date and time utilities for Indian Standard Time (IST, UTC+05:30)
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toISTDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + IST_OFFSET_MS);
}

function formatISTDate(date, options = {}) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

function formatISTDateTime(date, options = {}) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

function formatISODateString(date) {
  // Returns YYYY-MM-DD in IST
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

module.exports = {
  IST_OFFSET_MS,
  toISTDate,
  formatISTDate,
  formatISTDateTime,
  formatISODateString,
};
