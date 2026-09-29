/**
 * Date utility for Indian Standard Time (IST, UTC+05:30) conversions.
 * Rule: Dates are stored as Date (UTC in DB) and displayed/calculated in IST.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

/**
 * Parses a "YYYY-MM-DD" string (or Date) and returns a Date object corresponding
 * to IST midnight (00:00:00 IST) stored as a UTC Date instance.
 * For example: "2026-10-15" -> 2026-10-14T18:30:00.000Z
 */
function parseISTMidnight(dateInput) {
  if (!dateInput) return null;

  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);

      // IST 00:00:00 = UTC - 5h 30m
      const utcTime = Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS;
      return new Date(utcTime);
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  // Convert given date to IST midnight
  const istTime = d.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();

  const utcMidnight = Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMidnight);
}

/**
 * Formats a Date object to "YYYY-MM-DD" string in IST.
 */
function formatISTDate(date = new Date()) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const istDate = new Date(d.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Checks if two dates represent the same calendar day in IST.
 */
function isSameISTDate(dateA, dateB) {
  return formatISTDate(dateA) === formatISTDate(dateB);
}

/**
 * Combines an IST date and a time string "HH:mm" to produce a UTC Date object.
 */
function getISTDateTime(dateInput, timeStr = "00:00") {
  const midnight = parseISTMidnight(dateInput);
  if (!midnight) return null;

  const [hours, minutes] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  const totalMs = (hours * 60 + minutes) * 60 * 1000;
  return new Date(midnight.getTime() + totalMs);
}

module.exports = {
  IST_OFFSET_MS,
  parseISTMidnight,
  formatISTDate,
  getISTDateString: formatISTDate,
  isSameISTDate,
  getISTDateTime,
};
