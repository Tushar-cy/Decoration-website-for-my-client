const { z } = require("zod");
const FormSchema = require("../models/FormSchema");
const { recordAudit } = require("../services/auditService");
const AppError = require("../utils/AppError");

const fieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const formFieldSchema = z.object({
  id: z.string().min(1, "Field id is required"),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "select",
    "multiselect",
    "radio",
    "checkbox",
    "date",
    "phone",
    "email",
    "color",
  ]),
  label: z.string().min(1, "Field label is required"),
  helpText: z.string().optional().default(""),
  placeholder: z.string().optional().default(""),
  required: z.boolean().default(false),
  options: z.array(fieldOptionSchema).optional().default([]),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  pattern: z.string().nullable().optional(),
  showIf: z
    .object({
      fieldId: z.string(),
      equals: z.any(),
    })
    .nullable()
    .optional(),
  group: z.string().optional().default("General"),
});

const formSchemaInput = z.object({
  key: z.string().min(2).toLowerCase(),
  title: z.string().min(2),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  successMessage: z.string().optional(),
  notifyEmails: z.array(z.string().email()).optional().default([]),
  fields: z.array(formFieldSchema).min(1, "Form must have at least one field"),
});

/**
 * GET /api/admin/forms
 */
async function getAllForms(req, res, next) {
  try {
    const forms = await FormSchema.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      status: "success",
      data: { forms },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/forms/:key
 */
async function getFormSchema(req, res, next) {
  try {
    const form = await FormSchema.findOne({ key: req.params.key.toLowerCase().trim() }).lean();
    if (!form) {
      throw new AppError(`Form schema '${req.params.key}' not found`, 404);
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
 * POST /api/admin/forms
 */
async function createFormSchema(req, res, next) {
  try {
    const validated = formSchemaInput.parse(req.body);

    const existing = await FormSchema.findOne({ key: validated.key });
    if (existing) {
      throw new AppError(`Form with key '${validated.key}' already exists`, 409);
    }

    const form = await FormSchema.create(validated);

    await recordAudit({
      actorId: req.admin?.id,
      action: "FORM_SCHEMA_CREATED",
      entity: "FormSchema",
      entityId: form._id,
      before: null,
      after: form.toObject(),
      ip: req.ip,
    });

    return res.status(201).json({
      status: "success",
      data: { form },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/forms/:key
 * Updates form schema and automatically bumps the version so active submissions
 * can be tracked against schema versions.
 */
async function saveFormSchema(req, res, next) {
  try {
    const key = req.params.key.toLowerCase().trim();
    const form = await FormSchema.findOne({ key });

    if (!form) {
      throw new AppError(`Form schema '${key}' not found`, 404);
    }

    const validated = formSchemaInput.partial().parse(req.body);
    const beforeState = form.toObject();

    if (validated.title) form.title = validated.title;
    if (validated.description !== undefined) form.description = validated.description;
    if (validated.isActive !== undefined) form.isActive = validated.isActive;
    if (validated.successMessage) form.successMessage = validated.successMessage;
    if (validated.notifyEmails) form.notifyEmails = validated.notifyEmails;
    if (validated.fields) form.fields = validated.fields;

    // Bump version on schema change
    form.bumpVersion();

    await form.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "FORM_SCHEMA_UPDATED",
      entity: "FormSchema",
      entityId: form._id,
      before: beforeState,
      after: form.toObject(),
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { form },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/forms/:key/status
 */
async function toggleFormStatus(req, res, next) {
  try {
    const key = req.params.key.toLowerCase().trim();
    const form = await FormSchema.findOne({ key });

    if (!form) {
      throw new AppError(`Form schema '${key}' not found`, 404);
    }

    const prevStatus = form.isActive;
    form.isActive = !prevStatus;
    await form.save();

    await recordAudit({
      actorId: req.admin?.id,
      action: "FORM_STATUS_TOGGLED",
      entity: "FormSchema",
      entityId: form._id,
      before: { isActive: prevStatus },
      after: { isActive: form.isActive },
      ip: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: { form },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllForms,
  getFormSchema,
  createFormSchema,
  saveFormSchema,
  toggleFormStatus,
};
