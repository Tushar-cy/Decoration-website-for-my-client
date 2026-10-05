const { z } = require("zod");
const AppError = require("../utils/AppError");
const { normalizeIndianPhone } = require("../utils/phoneUtils");

/**
 * Strips HTML tags from strings to mitigate XSS vulnerabilities.
 */
function stripHtml(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

/**
 * Evaluates whether a field's showIf condition is satisfied given the current answers.
 */
function isFieldVisible(field, answers) {
  if (!field.showIf) return true;
  const { fieldId, equals } = field.showIf;
  const parentValue = answers[fieldId];

  if (Array.isArray(equals)) {
    return equals.includes(parentValue);
  }
  return parentValue === equals;
}

/**
 * Validates and sanitizes a form submission against its stored FormSchema.
 * 1. Rejects unknown fields not defined in the schema.
 * 2. Evaluates conditional visibility (showIf) server-side.
 * 3. Strips HTML and enforces strict length & type constraints.
 * 4. Produces an immutable answersSnapshot preserving schema labels at submission time.
 */
function validateAndSanitizeSubmission(schema, rawAnswers) {
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    throw new AppError("Answers must be a valid JSON object", 400);
  }

  const validFieldMap = new Map();
  schema.fields.forEach((f) => validFieldMap.set(f.id, f));

  // 1. Strict unknown field rejection
  for (const key of Object.keys(rawAnswers)) {
    if (!validFieldMap.has(key)) {
      throw new AppError(`Unknown field '${key}' is not permitted in this form schema`, 400);
    }
  }

  const sanitizedAnswers = {};
  const answersSnapshot = [];
  const errors = [];

  // 2. Validate each field defined in schema
  for (const field of schema.fields) {
    const rawVal = rawAnswers[field.id];
    const visible = isFieldVisible(field, rawAnswers);

    // If field is conditionally hidden, it is never required and excluded from active answers
    if (!visible) {
      continue;
    }

    // Check required constraint
    const isMissing =
      rawVal === undefined ||
      rawVal === null ||
      (typeof rawVal === "string" && rawVal.trim().length === 0) ||
      (Array.isArray(rawVal) && rawVal.length === 0);

    if (field.required && isMissing) {
      errors.push({ fieldId: field.id, message: `${field.label} is required` });
      continue;
    }

    if (isMissing) {
      sanitizedAnswers[field.id] = null;
      continue;
    }

    // Sanitize and validate by type
    let finalVal = rawVal;

    switch (field.type) {
      case "text": {
        if (typeof rawVal !== "string") {
          errors.push({ fieldId: field.id, message: `${field.label} must be text` });
          break;
        }
        const cleaned = stripHtml(rawVal);
        if (cleaned.length > 200) {
          errors.push({ fieldId: field.id, message: `${field.label} cannot exceed 200 characters` });
          break;
        }
        if (field.pattern) {
          const reg = new RegExp(field.pattern);
          if (!reg.test(cleaned)) {
            errors.push({ fieldId: field.id, message: `${field.label} has an invalid format` });
            break;
          }
        }
        finalVal = cleaned;
        break;
      }

      case "textarea": {
        if (typeof rawVal !== "string") {
          errors.push({ fieldId: field.id, message: `${field.label} must be text` });
          break;
        }
        const cleaned = stripHtml(rawVal);
        if (cleaned.length > 2000) {
          errors.push({ fieldId: field.id, message: `${field.label} cannot exceed 2000 characters` });
          break;
        }
        finalVal = cleaned;
        break;
      }

      case "number": {
        const num = Number(rawVal);
        if (isNaN(num)) {
          errors.push({ fieldId: field.id, message: `${field.label} must be a valid number` });
          break;
        }
        if (field.min !== null && field.min !== undefined && num < field.min) {
          errors.push({ fieldId: field.id, message: `${field.label} must be at least ${field.min}` });
          break;
        }
        if (field.max !== null && field.max !== undefined && num > field.max) {
          errors.push({ fieldId: field.id, message: `${field.label} cannot exceed ${field.max}` });
          break;
        }
        finalVal = num;
        break;
      }

      case "select":
      case "radio": {
        const cleaned = String(rawVal).trim();
        const validOptions = (field.options || []).map((o) => o.value);
        if (validOptions.length > 0 && !validOptions.includes(cleaned)) {
          errors.push({ fieldId: field.id, message: `Invalid option selected for ${field.label}` });
          break;
        }
        finalVal = cleaned;
        break;
      }

      case "multiselect": {
        if (!Array.isArray(rawVal)) {
          errors.push({ fieldId: field.id, message: `${field.label} must be a list of selected options` });
          break;
        }
        const validOptions = (field.options || []).map((o) => o.value);
        const cleanedArr = rawVal.map((v) => String(v).trim());
        const invalidSelections = cleanedArr.filter((v) => !validOptions.includes(v));
        if (invalidSelections.length > 0) {
          errors.push({ fieldId: field.id, message: `Invalid options selected for ${field.label}` });
          break;
        }
        finalVal = cleanedArr;
        break;
      }

      case "checkbox": {
        finalVal = Boolean(rawVal);
        break;
      }

      case "date": {
        const d = new Date(rawVal);
        if (isNaN(d.getTime())) {
          errors.push({ fieldId: field.id, message: `${field.label} must be a valid date` });
          break;
        }
        finalVal = d.toISOString().split("T")[0];
        break;
      }

      case "phone": {
        const rawStr = String(rawVal).trim();
        const digits = rawStr.replace(/[^\d]/g, "");
        if (digits.length < 10) {
          errors.push({ fieldId: field.id, message: `Please enter a valid 10-digit Indian phone number` });
          break;
        }
        finalVal = normalizeIndianPhone(rawStr);
        break;
      }

      case "email": {
        const rawStr = String(rawVal).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawStr)) {
          errors.push({ fieldId: field.id, message: `Please provide a valid email address` });
          break;
        }
        finalVal = rawStr;
        break;
      }

      case "color": {
        finalVal = String(rawVal).slice(0, 30).trim();
        break;
      }

      default:
        finalVal = rawVal;
    }

    sanitizedAnswers[field.id] = finalVal;

    // Snapshot retains current field label, value, and group
    answersSnapshot.push({
      fieldId: field.id,
      label: field.label,
      value: finalVal,
      group: field.group || "General",
    });
  }

  if (errors.length > 0) {
    const errorDetails = errors.map((e) => `  - ${e.fieldId}: ${e.message}`).join("\n");
    const appErr = new AppError(`Form validation failed:\n${errorDetails}`, 400);
    appErr.details = errors;
    throw appErr;
  }

  // Extract common contact info
  const name = sanitizedAnswers.name || sanitizedAnswers.celebrant_name || "Guest";
  const phone = sanitizedAnswers.phone || "";
  const email = sanitizedAnswers.email || "";

  return {
    sanitizedAnswers,
    answersSnapshot,
    name,
    phone,
    email,
  };
}

module.exports = {
  stripHtml,
  isFieldVisible,
  validateAndSanitizeSubmission,
};
