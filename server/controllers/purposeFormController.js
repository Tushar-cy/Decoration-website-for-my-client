const crypto = require("crypto");
const FormSchema = require("../models/FormSchema");
const Submission = require("../models/Submission");
const Settings = require("../models/Settings");
const { verifyTurnstile } = require("../services/turnstileService");
const { validateAndSanitizeSubmission } = require("../services/formValidationService");
const { enqueueNotification } = require("../queues/orderQueue");
const AppError = require("../utils/AppError");
const { logger } = require("../utils/logger");

/**
 * Generates a pre-filled WhatsApp click-to-chat URL with the customer's details.
 */
function buildWhatsAppUrl(businessWhatsapp, customerName, formTitle, eventDate, submissionId) {
  const cleanPhone = String(businessWhatsapp || "917015767715").replace(/[^\d]/g, "");
  const shortId = String(submissionId).slice(-6).toUpperCase();

  const text =
    `Hi Decor Joy Gurgaon! 🎉 I just submitted my event details on your website.\n\n` +
    `• Purpose: ${formTitle}\n` +
    `• Name: ${customerName}\n` +
    (eventDate ? `• Date: ${eventDate}\n` : "") +
    `• Ref ID: #${shortId}\n\n` +
    `Looking forward to receiving your decor mockups, themes, and pricing quote!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * GET /api/forms
 * Public list of active purpose forms for the chooser cards.
 */
async function getActivePurposes(req, res, next) {
  try {
    const forms = await FormSchema.find({ isActive: true })
      .select("key title description version fields successMessage")
      .lean();

    const result = forms.map((f) => ({
      key: f.key,
      title: f.title,
      description: f.description,
      version: f.version,
      fieldCount: (f.fields || []).length,
    }));

    return res.status(200).json({
      status: "success",
      data: { purposes: result },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/forms/:key
 * Public endpoint to fetch the full FormSchema for a chosen purpose.
 */
async function getFormByKey(req, res, next) {
  try {
    const formKey = req.params.key.toLowerCase().trim();
    const form = await FormSchema.findOne({ key: formKey, isActive: true }).lean();

    if (!form) {
      throw new AppError(`Purpose form '${formKey}' not found or is currently inactive`, 404);
    }

    return res.status(200).json({
      status: "success",
      data: { form },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/forms/:key/submissions
 * Public submission of a purpose form.
 * 1. Verifies Cloudflare Turnstile token and honeypot.
 * 2. Dynamically validates against schema, rejects unknown fields, evaluates showIf.
 * 3. Enforces 10-minute duplicate guard.
 * 4. Stores submission with immutable answersSnapshot.
 * 5. Returns prefilled WhatsApp link and enqueues owner notification.
 */
async function submitPurposeForm(req, res, next) {
  try {
    const formKey = req.params.key.toLowerCase().trim();
    const { answers, turnstileToken, _gotcha, honeypot, utm } = req.body || {};

    // 1. Anti-spam verification
    await verifyTurnstile({
      token: turnstileToken,
      honeypot: honeypot || _gotcha,
      remoteIp: req.ip,
    });

    // 2. Fetch schema
    const schema = await FormSchema.findOne({ key: formKey, isActive: true });
    if (!schema) {
      throw new AppError(`Form schema '${formKey}' is not active or does not exist`, 404);
    }

    // 3. Dynamic schema validation & sanitization
    const {
      sanitizedAnswers,
      answersSnapshot,
      name,
      phone,
      email,
    } = validateAndSanitizeSubmission(schema, answers);

    // 4. Duplicate Guard (same phone + formKey within 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingRecent = await Submission.findOne({
      formKey,
      phone,
      createdAt: { $gte: tenMinutesAgo },
    });

    const settings = await Settings.getSettings();
    const businessWhatsapp = settings.business?.whatsapp || "917015767715";

    if (existingRecent) {
      logger.info({ formKey, phone, submissionId: existingRecent._id }, "Duplicate submission within 10 min window returned existing submission");
      const whatsappUrl = buildWhatsAppUrl(
        businessWhatsapp,
        existingRecent.name,
        schema.title,
        existingRecent.answers?.event_date,
        existingRecent._id
      );

      return res.status(200).json({
        status: "success",
        isDuplicate: true,
        data: {
          submissionId: existingRecent._id,
          message: "We have already received your submission. Our stylists are preparing your concepts!",
          whatsappUrl,
        },
      });
    }

    // 5. Hash IP for privacy-preserving audit
    const ipHash = req.ip
      ? crypto.createHash("sha256").update(req.ip).digest("hex")
      : "";

    // 6. Create Submission
    const submission = await Submission.create({
      formKey,
      formVersion: schema.version,
      answers: sanitizedAnswers,
      answersSnapshot,
      name,
      phone,
      email: email || "",
      status: "new",
      utm: utm || {},
      ipHash,
    });

    logger.info({ submissionId: submission._id, formKey, name, phone }, "Created new purpose form submission");

    // 7. Enqueue background notification to owner/staff
    await enqueueNotification("SUBMISSION_RECEIVED", {
      submissionId: submission._id.toString(),
      formKey,
      formTitle: schema.title,
      name,
      phone,
      email,
      notifyEmails: schema.notifyEmails || [],
      answersSummary: answersSnapshot.slice(0, 5),
    });

    // 8. Generate WhatsApp click-to-chat CTA link
    const eventDate = sanitizedAnswers.event_date || "";
    const whatsappUrl = buildWhatsAppUrl(
      businessWhatsapp,
      name,
      schema.title,
      eventDate,
      submission._id
    );

    return res.status(201).json({
      status: "success",
      data: {
        submissionId: submission._id,
        message: schema.successMessage,
        whatsappUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActivePurposes,
  getFormByKey,
  submitPurposeForm,
};
