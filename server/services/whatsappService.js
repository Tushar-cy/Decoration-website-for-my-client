/**
 * server/services/whatsappService.js
 * WhatsApp Business API notification helper.
 *
 * Supports:
 *  - WhatsApp Business Cloud API (Meta) via HTTP (primary)
 *  - Fallback: Log the message for manual send
 *
 * The owner gets a WhatsApp ping for:
 *  1. New form submission (purpose inquiry)
 *  2. New order placed
 *  3. Payment confirmed
 *  4. Razorpay fallback activated (pay-on-confirmation)
 *
 * Set these env vars:
 *   WHATSAPP_PHONE_NUMBER_ID=  (your WA Business phone number ID)
 *   WHATSAPP_ACCESS_TOKEN=     (permanent system user token)
 *   OWNER_WHATSAPP=            (owner's WhatsApp number, e.g. 917015767715)
 */
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

const WA_API_BASE = "https://graph.facebook.com/v19.0";

/**
 * Send a plain-text WhatsApp message to a recipient.
 * @param {string} to - Recipient phone in international format without +, e.g. "917015767715"
 * @param {string} text - Message text (max 4096 chars)
 */
async function sendWhatsAppText(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    // Dev/test: just log
    logger.info({ to, preview: text.slice(0, 80) }, "WhatsApp [dev-noop]: would send message");
    return false;
  }

  try {
    const response = await fetch(`${WA_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn({ to, status: response.status, body }, "WhatsApp API returned non-2xx");
      return false;
    }

    logger.info({ to }, "WhatsApp message sent successfully");
    return true;
  } catch (err) {
    logger.warn({ err, to }, "WhatsApp message delivery failed");
    return false;
  }
}

/**
 * Get owner's WhatsApp number (falls back to business.whatsapp from Settings).
 */
function getOwnerWaNumber() {
  const raw = process.env.OWNER_WHATSAPP || "";
  // Strip any non-digits and leading +
  return raw.replace(/\D/g, "");
}

// ─── Notification helpers ───────────────────────────────────────────────────

/**
 * Notify owner of a new form (purpose inquiry) submission.
 */
async function notifyNewSubmission({ name, phone, formKey, submissionId }) {
  const ownerNum = getOwnerWaNumber();
  if (!ownerNum) return;

  const text =
    `🎉 *New Inquiry — Decor Joy*\n` +
    `Purpose: *${formKey?.toUpperCase()}*\n` +
    `Name: ${name}\n` +
    `Phone: ${phone}\n` +
    `\nReply or call them to confirm the booking.\n` +
    `Admin: https://decorjoygurgaon.com/admin/submissions`;

  await sendWhatsAppText(ownerNum, text);
}

/**
 * Notify owner of a new order.
 */
async function notifyNewOrder({ orderNumber, customerName, phone, totalPaise, eventDate, slotKey }) {
  const ownerNum = getOwnerWaNumber();
  if (!ownerNum) return;

  const totalRupees = (totalPaise / 100).toLocaleString("en-IN");
  const text =
    `🛍️ *New Order — Decor Joy*\n` +
    `Order: *#${orderNumber}*\n` +
    `Customer: ${customerName} (${phone})\n` +
    `Event: ${eventDate} | ${slotKey}\n` +
    `Total: ₹${totalRupees}\n` +
    `\nAdmin: https://decorjoygurgaon.com/admin/orders`;

  await sendWhatsAppText(ownerNum, text);
}

/**
 * Notify owner when payment is confirmed.
 */
async function notifyPaymentConfirmed({ orderNumber, customerName, amountPaise }) {
  const ownerNum = getOwnerWaNumber();
  if (!ownerNum) return;

  const amount = (amountPaise / 100).toLocaleString("en-IN");
  const text =
    `✅ *Payment Received — Decor Joy*\n` +
    `Order: *#${orderNumber}*\n` +
    `Customer: ${customerName}\n` +
    `Amount: ₹${amount}\n` +
    `\nAdmin: https://decorjoygurgaon.com/admin/orders`;

  await sendWhatsAppText(ownerNum, text);
}

/**
 * Notify owner when site switches to pay-on-confirmation (Razorpay circuit tripped).
 */
async function notifyRazorpayFallback() {
  const ownerNum = getOwnerWaNumber();
  if (!ownerNum) return;

  const text =
    `⚠️ *Alert — Decor Joy*\n` +
    `Razorpay is temporarily unavailable.\n` +
    `Site has auto-switched to *Pay on Confirmation* mode.\n` +
    `New orders will be confirmed manually.\n` +
    `\nCheck Razorpay dashboard and server logs.`;

  await sendWhatsAppText(ownerNum, text);
}

module.exports = {
  sendWhatsAppText,
  notifyNewSubmission,
  notifyNewOrder,
  notifyPaymentConfirmed,
  notifyRazorpayFallback,
};
