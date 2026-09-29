/**
 * Phone number utilities for Indian (+91) standard phone numbers
 */

const INDIAN_PHONE_REGEX = /^(?:(?:\+?91[\s.-]?)?|0)?[6-9]\d{9}$/;

function normalizeIndianPhone(input) {
  if (!input || typeof input !== "string") return "";
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `+91${cleaned.slice(1)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return input.trim();
}

function isValidIndianPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  return INDIAN_PHONE_REGEX.test(phone.trim());
}

module.exports = {
  INDIAN_PHONE_REGEX,
  normalizeIndianPhone,
  isValidIndianPhone,
};
