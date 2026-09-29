/**
 * Money and Currency Utilities.
 * Rule: Money is stored strictly in paise as integers (₹1 = 100 paise).
 */

/**
 * Formats paise integer into Indian Rupees string (e.g. 449900 -> "₹4,499").
 * @param {number} paise 
 * @param {boolean} [showDecimals=false]
 * @returns {string}
 */
export function formatPaise(paise, showDecimals = false) {
  if (typeof paise !== "number" || isNaN(paise)) return "₹0";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Formats a Date object or ISO string into IST Date display (e.g. "15 Oct 2026").
 * @param {Date|string} dateInput 
 * @returns {string}
 */
export function formatISTDisplay(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
