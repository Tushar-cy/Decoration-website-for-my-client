/**
 * server/services/whatsappService.js
 * WhatsApp Business API notification helper.
 *
 * The owner gets a WhatsApp ping for new lead inquiries & form submissions.
 *
 * Env vars:
 *   WHATSAPP_PHONE_NUMBER_ID=  (WA Business phone number ID)
 *   WHATSAPP_ACCESS_TOKEN=     (permanent system user token)
 *   OWNER_WHATSAPP=            (owner's WhatsApp number, e.g. 917015767715)
 */
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
    // Dev/test: log
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
  const raw = process.env.OWNER_WHATSAPP || "917015767715";
  return raw.replace(/\D/g, "");
}

/**
 * Notify owner of a new form (purpose inquiry) submission.
 */
async function notifyNewSubmission({ name, phone, formKey, submissionId }) {
  const ownerNum = getOwnerWaNumber();
  if (!ownerNum) return;

  const text =
    `🎉 *New Inquiry — Decor Joy Gurgaon*\n` +
    `Purpose: *${formKey?.toUpperCase()}*\n` +
    `Name: ${name}\n` +
    `Phone: ${phone}\n` +
    `\nReply or call customer to discuss and finalize their decor setup.\n` +
    `Admin: https://decorjoygurgaon.com/admin/submissions`;

  await sendWhatsAppText(ownerNum, text);
}

module.exports = {
  sendWhatsAppText,
  notifyNewSubmission,
  getOwnerWaNumber,
};
