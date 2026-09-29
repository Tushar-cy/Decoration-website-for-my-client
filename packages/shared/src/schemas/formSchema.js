const { z } = require("zod");

const formFieldTypeEnum = z.enum([
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
]);

const formFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const formFieldShowIfSchema = z.object({
  fieldId: z.string(),
  equals: z.any(),
});

const formFieldSchema = z.object({
  id: z.string().min(1),
  type: formFieldTypeEnum,
  label: z.string().min(1),
  helpText: z.string().optional().default(""),
  placeholder: z.string().optional().default(""),
  required: z.boolean().default(false),
  options: z.array(formFieldOptionSchema).optional().default([]),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  showIf: formFieldShowIfSchema.optional().nullable(),
  group: z.string().optional().default("general"),
});

const formSchemaMutationSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  version: z.number().int().default(1),
  successMessage: z.string().default("Thank you! Our styling team will get in touch shortly."),
  notifyEmails: z.array(z.string().email()).default([]),
  fields: z.array(formFieldSchema).min(1),
});

const submissionPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  answers: z.record(z.any()),
});

module.exports = {
  formFieldTypeEnum,
  formFieldOptionSchema,
  formFieldShowIfSchema,
  formFieldSchema,
  formSchemaMutationSchema,
  submissionPayloadSchema,
};
