/**
 * server/utils/phoneUtils.js
 * Utility helper to normalize Indian mobile numbers to E.164 format (+91XXXXXXXXXX)
 */

function normalizeIndianPhone(rawPhone) {
  if (!rawPhone) return "";
  const cleaned = String(rawPhone).replace(/[^\d]/g, "");

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `+91${cleaned.slice(1)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

module.exports = {
  normalizeIndianPhone,
};
