import React, { useState, useEffect, useMemo, useRef } from "react";
import { getPurposeForm, submitPurposeForm } from "../services/api";
import "../styles/purposeForm.css";

function PurposeForm({ formKey, onCancel, onSuccess }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Form answers state
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // Anti-spam Turnstile token and honeypot
  const [turnstileToken, setTurnstileToken] = useState("turnstile_client_token_" + Date.now());
  const [honeypot, setHoneypot] = useState("");

  // Stepper state for grouped fields
  const [currentStep, setCurrentStep] = useState(0);

  const turnstileContainerRef = useRef(null);

  // 1. Fetch form schema
  const fetchSchema = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getPurposeForm(formKey);
      const formDoc = res.data?.data?.form || res.data?.form;
      if (!formDoc) {
        throw new Error("Form schema not found");
      }
      setSchema(formDoc);

      // Restore draft from localStorage if available
      const draftKey = `draft_purpose_${formKey}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === "object") {
            setAnswers(parsed);
            setDraftRestored(true);
          }
        } catch (e) {}
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formKey) {
      fetchSchema();
    }
  }, [formKey]);

  // 2. Autosave draft to localStorage (debounced)
  useEffect(() => {
    if (!formKey || Object.keys(answers).length === 0 || successData) return;

    const timer = setTimeout(() => {
      localStorage.setItem(`draft_purpose_${formKey}`, JSON.stringify(answers));
    }, 500);

    return () => clearTimeout(timer);
  }, [answers, formKey, successData]);

  // 3. Clear draft helper
  const handleClearDraft = () => {
    localStorage.removeItem(`draft_purpose_${formKey}`);
    setAnswers({});
    setDraftRestored(false);
    setErrors({});
  };

  // 4. Calculate grouped fields for the stepper
  const groups = useMemo(() => {
    if (!schema?.fields) return [];

    const groupMap = new Map();
    schema.fields.forEach((field) => {
      const groupName = field.group || "General Details";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      groupMap.get(groupName).push(field);
    });

    return Array.from(groupMap.entries()).map(([name, fields]) => ({
      name,
      fields,
    }));
  }, [schema]);

  // 5. Evaluate conditional showIf visibility
  const isFieldVisible = (field) => {
    if (!field.showIf) return true;
    const { fieldId, equals } = field.showIf;
    const currentVal = answers[fieldId];
    if (Array.isArray(equals)) {
      return equals.includes(currentVal);
    }
    return currentVal === equals;
  };

  // 6. Handle input changes with Indian phone formatting
  const handleFieldChange = (fieldId, value, fieldType) => {
    let formattedVal = value;

    if (fieldType === "phone") {
      // Auto-format for Indian phone numbers
      const cleaned = String(value).replace(/[^\d+]/g, "");
      formattedVal = cleaned;
    }

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: formattedVal,
    }));

    // Clear field-level error on change
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // 7. Validate specific step or all fields
  const validateFields = (fieldsToValidate) => {
    const newErrors = {};

    fieldsToValidate.forEach((field) => {
      if (!isFieldVisible(field)) return;

      const val = answers[field.id];
      const isMissing =
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim().length === 0) ||
        (Array.isArray(val) && val.length === 0);

      if (field.required && isMissing) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      if (isMissing) return;

      if (field.type === "phone") {
        const digits = String(val).replace(/[^\d]/g, "");
        if (digits.length < 10) {
          newErrors[field.id] = "Please enter a valid 10-digit Indian phone number";
        }
      }

      if (field.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }

      if (field.type === "number") {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.id] = "Must be a valid number";
        } else if (field.min !== null && field.min !== undefined && num < field.min) {
          newErrors[field.id] = `Minimum allowed is ${field.min}`;
        } else if (field.max !== null && field.max !== undefined && num > field.max) {
          newErrors[field.id] = `Maximum allowed is ${field.max}`;
        }
      }
    });

    return newErrors;
  };

  // 8. Navigation handlers
  const handleNextStep = (e) => {
    e.preventDefault();
    const currentGroupFields = groups[currentStep]?.fields || [];
    const stepErrors = validateFields(currentGroupFields);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (currentStep < groups.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 9. Final Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all schema fields
    const allErrors = validateFields(schema.fields);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Find step with the first error
      const firstErrorFieldId = Object.keys(allErrors)[0];
      const errorStepIndex = groups.findIndex((g) =>
        g.fields.some((f) => f.id === firstErrorFieldId)
      );
      if (errorStepIndex !== -1) {
        setCurrentStep(errorStepIndex);
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers,
        turnstileToken,
        formVersion: schema.version,
        honeypot, // Honeypot field
        utm: {
          source: new URLSearchParams(window.location.search).get("utm_source") || "website",
        },
      };

      const res = await submitPurposeForm(formKey, payload);
      const data = res.data?.data || res.data;

      // Clear draft on success
      localStorage.removeItem(`draft_purpose_${formKey}`);
      setSuccessData(data);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || "Failed to submit request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate minimum date = today + 1 day
  const minDateString = useMemo(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="purpose-form-loading">
        <div className="spinner"></div>
        <p>Loading celebration form...</p>
      </div>
    );
  }

  // Error State with Retry
  if (fetchError) {
    return (
      <div className="purpose-form-error-card">
        <h3>Could Not Load Purpose Form</h3>
        <p>{fetchError}</p>
        <button className="btn btn-gold" onClick={fetchSchema}>
          Retry Loading
        </button>
      </div>
    );
  }

  // Success State with WhatsApp CTA
  if (successData) {
    return (
      <div className="purpose-form-success">
        <div className="success-icon-badge">✓</div>
        <h2>Request Received!</h2>
        <p className="success-desc">
          {successData.message ||
            "Thank you! Our decor stylists will connect with you on WhatsApp within 30 minutes."}
        </p>

        <div className="success-ref-card">
          <span>Submission Reference</span>
          <strong>#{String(successData.submissionId).slice(-6).toUpperCase()}</strong>
        </div>

        {successData.whatsappUrl && (
          <div className="whatsapp-cta-block">
            <a
              href={successData.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <span>💬</span> Chat with Stylist on WhatsApp
            </a>
            <span className="whatsapp-hint">
              Tap above to get immediate mockups, balloon samples, and priority booking!
            </span>
          </div>
        )}

        <button
          className="btn btn-secondary"
          style={{ marginTop: "24px" }}
          onClick={() => {
            setSuccessData(null);
            setAnswers({});
            setCurrentStep(0);
          }}
        >
          Plan Another Celebration
        </button>
      </div>
    );
  }

  const currentGroup = groups[currentStep] || { name: "", fields: [] };
  const progressPercent = Math.round(((currentStep + 1) / groups.length) * 100);

  return (
    <div className="purpose-form-container">
      {/* Header */}
      <div className="purpose-form-header">
        <div className="purpose-badge">🎉 {schema.title}</div>
        <h2 className="purpose-heading">{schema.title} Planning</h2>
        {schema.description && <p className="purpose-subheading">{schema.description}</p>}

        {/* Stepper Progress Bar */}
        <div className="stepper-progress-wrapper">
          <div className="stepper-meta">
            <span className="step-count">
              Step {currentStep + 1} of {groups.length}: <strong>{currentGroup.name}</strong>
            </span>
            <span className="step-percent">{progressPercent}%</span>
          </div>
          <div className="stepper-bar-track">
            <div className="stepper-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {draftRestored && (
          <div className="draft-alert">
            <span>💾 Resumed from your saved draft</span>
            <button type="button" onClick={handleClearDraft} className="clear-draft-link">
              Clear & Start Fresh
            </button>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={currentStep === groups.length - 1 ? handleSubmit : handleNextStep} noValidate>
        {/* Anti-spam Honeypot Field */}
        <input
          type="text"
          name="_gotcha"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {submitError && <div className="form-submit-error">{submitError}</div>}

        {/* Current Step Fields */}
        <div className="form-fields-group">
          {currentGroup.fields.map((field) => {
            if (!isFieldVisible(field)) return null;

            const fieldError = errors[field.id];
            const val = answers[field.id] ?? "";

            return (
              <div key={field.id} className={`form-field-item ${fieldError ? "has-error" : ""}`}>
                <label htmlFor={field.id} className="field-label">
                  {field.label} {field.required && <span className="req-star">*</span>}
                </label>

                {field.helpText && <p className="field-help-text">{field.helpText}</p>}

                {/* Text / Phone / Email */}
                {["text", "phone", "email"].includes(field.type) && (
                  <input
                    id={field.id}
                    type={field.type === "phone" ? "tel" : field.type}
                    value={val}
                    onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                    placeholder={field.placeholder || ""}
                    className="form-control"
                  />
                )}

                {/* Textarea */}
                {field.type === "textarea" && (
                  <textarea
                    id={field.id}
                    value={val}
                    onChange={(e) => handleFieldChange(field.id, e.target.value, "textarea")}
                    placeholder={field.placeholder || ""}
                    rows={4}
                    className="form-control"
                  />
                )}

                {/* Number */}
                {field.type === "number" && (
                  <input
                    id={field.id}
                    type="number"
                    value={val}
                    min={field.min ?? undefined}
                    max={field.max ?? undefined}
                    onChange={(e) => handleFieldChange(field.id, e.target.value, "number")}
                    placeholder={field.placeholder || ""}
                    className="form-control"
                  />
                )}

                {/* Date */}
                {field.type === "date" && (
                  <input
                    id={field.id}
                    type="date"
                    min={minDateString}
                    value={val}
                    onChange={(e) => handleFieldChange(field.id, e.target.value, "date")}
                    className="form-control"
                  />
                )}

                {/* Select */}
                {field.type === "select" && (
                  <select
                    id={field.id}
                    value={val}
                    onChange={(e) => handleFieldChange(field.id, e.target.value, "select")}
                    className="form-control"
                  >
                    <option value="">{field.placeholder || "-- Select an option --"}</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Radio */}
                {field.type === "radio" && (
                  <div className="radio-options-grid">
                    {(field.options || []).map((opt) => (
                      <label key={opt.value} className={`radio-pill ${val === opt.value ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name={field.id}
                          value={opt.value}
                          checked={val === opt.value}
                          onChange={() => handleFieldChange(field.id, opt.value, "radio")}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Multiselect */}
                {field.type === "multiselect" && (
                  <div className="multiselect-grid">
                    {(field.options || []).map((opt) => {
                      const selectedArr = Array.isArray(val) ? val : [];
                      const isChecked = selectedArr.includes(opt.value);
                      return (
                        <label key={opt.value} className={`checkbox-pill ${isChecked ? "selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selectedArr, opt.value]
                                : selectedArr.filter((x) => x !== opt.value);
                              handleFieldChange(field.id, next, "multiselect");
                            }}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Checkbox */}
                {field.type === "checkbox" && (
                  <label className="single-checkbox-label">
                    <input
                      id={field.id}
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked, "checkbox")}
                    />
                    <span>{field.placeholder || "Yes, include this"}</span>
                  </label>
                )}

                {/* Error message */}
                {fieldError && <span className="field-error-msg">{fieldError}</span>}
              </div>
            );
          })}
        </div>

        {/* Cloudflare Turnstile Widget Placeholder */}
        <div ref={turnstileContainerRef} className="turnstile-container">
          <div className="turnstile-badge">
            <span className="shield-icon">🛡️</span> Protected by Cloudflare Turnstile
          </div>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="stepper-actions">
          {currentStep > 0 && (
            <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>
              ← Back
            </button>
          )}

          {currentStep < groups.length - 1 ? (
            <button type="button" className="btn btn-gold" onClick={handleNextStep}>
              Next: {groups[currentStep + 1]?.name} →
            </button>
          ) : (
            <button type="submit" className="btn btn-gold submit-btn" disabled={submitting}>
              {submitting ? "Submitting Request..." : "Submit Event Plan →"}
            </button>
          )}

          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default PurposeForm;
