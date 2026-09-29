import React, { useState, useEffect } from "react";
import { getAdminForms, saveAdminForm, toggleAdminFormStatus } from "../services/api";

const FIELD_TYPES = [
  { value: "text", label: "Single-line Text" },
  { value: "textarea", label: "Multi-line Textarea" },
  { value: "number", label: "Number Input" },
  { value: "select", label: "Dropdown Select" },
  { value: "multiselect", label: "Multi-Select Choices" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Single Checkbox" },
  { value: "date", label: "Date Picker" },
  { value: "phone", label: "Phone (+91)" },
  { value: "email", label: "Email Address" },
  { value: "color", label: "Color Picker" },
];

function FormBuilder() {
  const [forms, setForms] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [currentForm, setCurrentForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [openFieldId, setOpenFieldId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previewValues, setPreviewValues] = useState({});

  useEffect(() => {
    loadAllForms();
  }, []);

  const loadAllForms = async (preserveKey = null) => {
    try {
      setLoading(true);
      const res = await getAdminForms();
      const list = res.data?.data?.forms || [];
      setForms(list);

      const targetKey = preserveKey || selectedKey || (list.length > 0 ? list[0].key : "");
      if (targetKey) {
        setSelectedKey(targetKey);
        const active = list.find((f) => f.key === targetKey);
        if (active) {
          // Deep clone to allow safe editing
          setCurrentForm(JSON.parse(JSON.stringify(active)));
          setPreviewValues({});
        }
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to load forms from server." });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (key) => {
    setSelectedKey(key);
    const target = forms.find((f) => f.key === key);
    if (target) {
      setCurrentForm(JSON.parse(JSON.stringify(target)));
      setOpenFieldId(null);
      setPreviewValues({});
      setFeedback(null);
    }
  };

  // Field Reordering (Drag and Drop)
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...currentForm.fields];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setCurrentForm({ ...currentForm, fields: reordered });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Move buttons
  const moveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentForm.fields.length) return;
    const reordered = [...currentForm.fields];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setCurrentForm({ ...currentForm, fields: reordered });
  };

  // Update Field
  const updateField = (index, updates) => {
    const fields = [...currentForm.fields];
    fields[index] = { ...fields[index], ...updates };
    setCurrentForm({ ...currentForm, fields });
  };

  // Remove Field
  const removeField = (index) => {
    if (window.confirm("Remove this field from the purpose form?")) {
      const fields = [...currentForm.fields];
      fields.splice(index, 1);
      setCurrentForm({ ...currentForm, fields });
    }
  };

  // Add New Field
  const handleAddField = () => {
    const newId = `field_${Date.now()}`;
    const newField = {
      id: newId,
      type: "text",
      label: "New Question",
      helpText: "",
      placeholder: "",
      required: false,
      options: [],
      min: null,
      max: null,
      pattern: null,
      showIf: null,
      group: "General",
    };
    setCurrentForm({
      ...currentForm,
      fields: [...currentForm.fields, newField],
    });
    setOpenFieldId(newId);
  };

  // Options Handling
  const addOption = (fieldIndex) => {
    const field = currentForm.fields[fieldIndex];
    const options = [...(field.options || [])];
    const optNum = options.length + 1;
    options.push({ value: `opt_${optNum}`, label: `Option ${optNum}` });
    updateField(fieldIndex, { options });
  };

  const updateOption = (fieldIndex, optIndex, key, val) => {
    const field = currentForm.fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optIndex] = { ...options[optIndex], [key]: val };
    updateField(fieldIndex, { options });
  };

  const removeOption = (fieldIndex, optIndex) => {
    const field = currentForm.fields[fieldIndex];
    const options = [...(field.options || [])];
    options.splice(optIndex, 1);
    updateField(fieldIndex, { options });
  };

  // Toggle Active
  const handleToggleActive = async () => {
    try {
      const res = await toggleAdminFormStatus(currentForm.key);
      const updated = res.data?.data?.form;
      setCurrentForm({ ...currentForm, isActive: updated.isActive });
      setFeedback({
        type: "success",
        message: `Form is now ${updated.isActive ? "ACTIVE (Public)" : "INACTIVE (Hidden)"}`,
      });
      loadAllForms(currentForm.key);
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to update form status." });
    }
  };

  // Save Schema
  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      // Validation
      if (!currentForm.title.trim()) {
        setFeedback({ type: "error", message: "Form title cannot be empty." });
        return;
      }
      if (currentForm.fields.length === 0) {
        setFeedback({ type: "error", message: "Form must have at least one field." });
        return;
      }

      // Check unique field IDs
      const ids = currentForm.fields.map((f) => f.id.trim());
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dupes.length > 0) {
        setFeedback({
          type: "error",
          message: `Field ID '${dupes[0]}' is duplicated. Each field must have a unique ID.`,
        });
        return;
      }

      const payload = {
        title: currentForm.title,
        description: currentForm.description || "",
        isActive: currentForm.isActive,
        successMessage: currentForm.successMessage,
        notifyEmails: Array.isArray(currentForm.notifyEmails)
          ? currentForm.notifyEmails
          : String(currentForm.notifyEmails || "")
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean),
        fields: currentForm.fields.map((f) => ({
          ...f,
          id: f.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          label: f.label.trim(),
          group: f.group ? f.group.trim() : "General",
        })),
      };

      const res = await saveAdminForm(currentForm.key, payload);
      const saved = res.data?.data?.form;

      setCurrentForm(JSON.parse(JSON.stringify(saved)));
      setFeedback({
        type: "success",
        message: `Schema updated successfully! Version automatically bumped to v${saved.version}. Public form is updated immediately.`,
      });
      loadAllForms(currentForm.key);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to save form schema.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  // Live preview condition evaluator
  const isFieldVisibleInPreview = (field) => {
    if (!field.showIf || !field.showIf.fieldId) return true;
    const triggerVal = previewValues[field.showIf.fieldId];
    return String(triggerVal).toLowerCase() === String(field.showIf.equals).toLowerCase();
  };

  if (loading && !currentForm) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Loading Purpose Form Schemas...
      </div>
    );
  }

  return (
    <div className="form-builder-page">
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Purpose Form Builder</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Design and customize schema-driven inquiry flows for every celebration type.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {currentForm && (
            <>
              <button
                type="button"
                className="btn-action-edit"
                onClick={handleToggleActive}
                style={{
                  background: currentForm.isActive ? "#f0fdf4" : "#fef2f2",
                  color: currentForm.isActive ? "#16a34a" : "#dc2626",
                  borderColor: currentForm.isActive ? "#bbf7d0" : "#fecaca",
                  fontWeight: 600,
                }}
              >
                {currentForm.isActive ? "● Active in Chooser" : "○ Inactive (Hidden)"}
              </button>

              <button
                type="button"
                className="btn-admin-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving & Bumping..." : "💾 Save & Publish Version"}
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "success" ? "#166534" : "#991b1b",
            fontSize: "0.9rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Purpose Tabs Bar */}
      <div className="fb-tabs-bar">
        {forms.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`fb-tab-btn ${selectedKey === f.key ? "active" : ""}`}
            onClick={() => handleSelectForm(f.key)}
          >
            <span>{f.title}</span>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 6px",
                borderRadius: "10px",
                background: selectedKey === f.key ? "rgba(255,255,255,0.2)" : "#e2e8f0",
              }}
            >
              v{f.version}
            </span>
          </button>
        ))}
      </div>

      {currentForm && (
        <div className="fb-layout">
          {/* LEFT: Schema Settings & Fields Editor */}
          <div className="fb-left-col">
            {/* General Purpose Settings */}
            <div className="fb-card">
              <div className="fb-card-title">
                <span>Purpose Settings ({currentForm.key})</span>
                <span className="status-pill status-new" style={{ fontSize: "0.75rem" }}>
                  Active Version: v{currentForm.version}
                </span>
              </div>

              <div className="fb-field-grid">
                <div className="fb-input-group">
                  <label className="fb-input-label">Title</label>
                  <input
                    type="text"
                    className="fb-input"
                    value={currentForm.title}
                    onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
                  />
                </div>

                <div className="fb-input-group">
                  <label className="fb-input-label">Notify Emails (Comma separated)</label>
                  <input
                    type="text"
                    className="fb-input"
                    value={
                      Array.isArray(currentForm.notifyEmails)
                        ? currentForm.notifyEmails.join(", ")
                        : currentForm.notifyEmails || ""
                    }
                    onChange={(e) =>
                      setCurrentForm({ ...currentForm, notifyEmails: e.target.value.split(",") })
                    }
                    placeholder="owner@decorjoy.in, leads@decorjoy.in"
                  />
                </div>
              </div>

              <div className="fb-input-group" style={{ marginTop: "12px" }}>
                <label className="fb-input-label">Description / Subtitle</label>
                <input
                  type="text"
                  className="fb-input"
                  value={currentForm.description || ""}
                  onChange={(e) => setCurrentForm({ ...currentForm, description: e.target.value })}
                  placeholder="Short description displayed on chooser cards..."
                />
              </div>

              <div className="fb-input-group" style={{ marginTop: "12px" }}>
                <label className="fb-input-label">Custom Success Screen Message</label>
                <input
                  type="text"
                  className="fb-input"
                  value={currentForm.successMessage || ""}
                  onChange={(e) =>
                    setCurrentForm({ ...currentForm, successMessage: e.target.value })
                  }
                  placeholder="Thank you! Our Gurgaon celebration designer will contact you within 15 minutes."
                />
              </div>
            </div>

            {/* Fields List */}
            <div className="fb-card">
              <div className="fb-card-title">
                <span>Form Fields ({currentForm.fields.length})</span>
                <button
                  type="button"
                  className="btn-admin-primary"
                  onClick={handleAddField}
                  style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                >
                  ➕ Add Question
                </button>
              </div>

              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "16px" }}>
                Drag items or use the up/down arrows to reorder questions. Fields in the same Group are bundled together into a single step on mobile.
              </p>

              <div className="fb-fields-container">
                {currentForm.fields.map((field, index) => {
                  const isOpen = openFieldId === field.id;
                  const hasOptions = ["select", "multiselect", "radio"].includes(field.type);

                  return (
                    <div
                      key={field.id || index}
                      className={`fb-field-item ${draggedIndex === index ? "dragging" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div
                        className={`fb-field-header ${isOpen ? "open" : ""}`}
                        onClick={() => setOpenFieldId(isOpen ? null : field.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{ cursor: "grab", color: "#94a3b8", fontSize: "1rem" }}
                            title="Drag to reorder"
                          >
                            ☰
                          </span>
                          <div>
                            <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>
                              {field.label || "Untitled Field"}
                            </strong>
                            {field.required && (
                              <span style={{ color: "#dc2626", marginLeft: "4px" }}>*</span>
                            )}
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              <span style={{ fontFamily: "monospace", color: "#475569" }}>
                                {field.id}
                              </span>{" "}
                              • <span style={{ textTransform: "capitalize" }}>{field.type}</span> • Group:{" "}
                              <strong>{field.group || "General"}</strong>
                              {field.showIf && (
                                <span style={{ color: "#b88932", marginLeft: "6px" }}>
                                  (Conditional on {field.showIf.fieldId})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{ display: "flex", alignItems: "center", gap: "6px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ padding: "4px 8px" }}
                            disabled={index === 0}
                            onClick={() => moveField(index, -1)}
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ padding: "4px 8px" }}
                            disabled={index === currentForm.fields.length - 1}
                            onClick={() => moveField(index, 1)}
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            style={{ padding: "4px 8px" }}
                            onClick={() => removeField(index)}
                            title="Delete Field"
                          >
                            ✕
                          </button>
                          <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "6px" }}>
                            {isOpen ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Field Settings */}
                      {isOpen && (
                        <div className="fb-field-body">
                          <div className="fb-field-grid">
                            <div className="fb-input-group">
                              <label className="fb-input-label">Label / Question</label>
                              <input
                                type="text"
                                className="fb-input"
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                              />
                            </div>

                            <div className="fb-input-group">
                              <label className="fb-input-label">Field ID (Unique Key)</label>
                              <input
                                type="text"
                                className="fb-input"
                                value={field.id}
                                onChange={(e) => updateField(index, { id: e.target.value })}
                              />
                            </div>

                            <div className="fb-input-group">
                              <label className="fb-input-label">Field Type</label>
                              <select
                                className="fb-select"
                                value={field.type}
                                onChange={(e) => updateField(index, { type: e.target.value })}
                              >
                                {FIELD_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="fb-input-group">
                              <label className="fb-input-label">Group / Step Title</label>
                              <input
                                type="text"
                                className="fb-input"
                                value={field.group || "General"}
                                onChange={(e) => updateField(index, { group: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="fb-field-grid">
                            <div className="fb-input-group">
                              <label className="fb-input-label">Placeholder</label>
                              <input
                                type="text"
                                className="fb-input"
                                value={field.placeholder || ""}
                                onChange={(e) =>
                                  updateField(index, { placeholder: e.target.value })
                                }
                              />
                            </div>

                            <div className="fb-input-group">
                              <label className="fb-input-label">Help Text</label>
                              <input
                                type="text"
                                className="fb-input"
                                value={field.helpText || ""}
                                onChange={(e) => updateField(index, { helpText: e.target.value })}
                              />
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                              />
                              Required Field
                            </label>
                          </div>

                          {/* Options Editor for Select, Multiselect, Radio */}
                          {hasOptions && (
                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span className="fb-input-label">Selectable Options</span>
                                <button
                                  type="button"
                                  className="btn-action-edit"
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                  onClick={() => addOption(index)}
                                >
                                  ➕ Add Option
                                </button>
                              </div>

                              <div className="fb-options-list">
                                {(field.options || []).map((opt, optIdx) => (
                                  <div key={optIdx} className="fb-option-row">
                                    <input
                                      type="text"
                                      className="fb-input"
                                      placeholder="Value (e.g. pastel)"
                                      value={opt.value}
                                      onChange={(e) =>
                                        updateOption(index, optIdx, "value", e.target.value)
                                      }
                                      style={{ flex: 1 }}
                                    />
                                    <input
                                      type="text"
                                      className="fb-input"
                                      placeholder="Display Label (e.g. Pastel Dreams)"
                                      value={opt.label}
                                      onChange={(e) =>
                                        updateOption(index, optIdx, "label", e.target.value)
                                      }
                                      style={{ flex: 1.5 }}
                                    />
                                    <button
                                      type="button"
                                      className="btn-action-delete"
                                      style={{ padding: "6px 10px" }}
                                      onClick={() => removeOption(index, optIdx)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Conditional Display (showIf) */}
                          <div className="fb-condition-box">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 700, color: "#92400e", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(field.showIf)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // pick first other field
                                      const other = currentForm.fields.find((f) => f.id !== field.id);
                                      updateField(index, {
                                        showIf: { fieldId: other ? other.id : "", equals: "yes" },
                                      });
                                    } else {
                                      updateField(index, { showIf: null });
                                    }
                                  }}
                                />
                                Conditional Logic: Show this question only if another field matches
                              </label>
                            </div>

                            {field.showIf && (
                              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <div style={{ flex: 1 }}>
                                  <label className="fb-input-label" style={{ color: "#92400e" }}>
                                    When Field
                                  </label>
                                  <select
                                    className="fb-select"
                                    value={field.showIf.fieldId}
                                    onChange={(e) =>
                                      updateField(index, {
                                        showIf: { ...field.showIf, fieldId: e.target.value },
                                      })
                                    }
                                  >
                                    <option value="">-- Choose Field --</option>
                                    {currentForm.fields
                                      .filter((f) => f.id !== field.id)
                                      .map((f) => (
                                        <option key={f.id} value={f.id}>
                                          {f.label} ({f.id})
                                        </option>
                                      ))}
                                  </select>
                                </div>

                                <div style={{ flex: 1 }}>
                                  <label className="fb-input-label" style={{ color: "#92400e" }}>
                                    Equals Value
                                  </label>
                                  <input
                                    type="text"
                                    className="fb-input"
                                    value={field.showIf.equals}
                                    onChange={(e) =>
                                      updateField(index, {
                                        showIf: { ...field.showIf, equals: e.target.value },
                                      })
                                    }
                                    placeholder="e.g. yes"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Interactive Preview */}
          <div className="fb-right-col" style={{ position: "sticky", top: "20px" }}>
            <div className="fb-card">
              <div className="fb-card-title">
                <span>📱 Live Customer Preview</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Real-time Rendering</span>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    {currentForm.title}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                    {currentForm.description}
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("Preview mode: Form is interactive! Inputs update showIf triggers.");
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "14px" }}
                >
                  {currentForm.fields.map((f) => {
                    if (!isFieldVisibleInPreview(f)) return null;

                    const val = previewValues[f.id] || "";

                    return (
                      <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.84rem", fontWeight: 600, color: "#334155" }}>
                          {f.label}{" "}
                          {f.required && <span style={{ color: "#dc2626" }}>*</span>}
                        </label>

                        {/* Rendering by Type */}
                        {f.type === "textarea" ? (
                          <textarea
                            className="fb-textarea"
                            placeholder={f.placeholder}
                            rows={3}
                            value={val}
                            onChange={(e) =>
                              setPreviewValues({ ...previewValues, [f.id]: e.target.value })
                            }
                          />
                        ) : ["select", "multiselect"].includes(f.type) ? (
                          <select
                            className="fb-select"
                            value={val}
                            onChange={(e) =>
                              setPreviewValues({ ...previewValues, [f.id]: e.target.value })
                            }
                          >
                            <option value="">Select an option...</option>
                            {(f.options || []).map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "radio" ? (
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            {(f.options || []).map((o) => (
                              <label
                                key={o.value}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "0.82rem",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`preview_${f.id}`}
                                  value={o.value}
                                  checked={val === o.value}
                                  onChange={(e) =>
                                    setPreviewValues({ ...previewValues, [f.id]: e.target.value })
                                  }
                                />
                                {o.label}
                              </label>
                            ))}
                          </div>
                        ) : f.type === "checkbox" ? (
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) =>
                                setPreviewValues({ ...previewValues, [f.id]: e.target.checked })
                              }
                            />
                            {f.placeholder || f.label}
                          </label>
                        ) : (
                          <input
                            type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "color" ? "color" : "text"}
                            className="fb-input"
                            placeholder={f.placeholder}
                            value={val}
                            onChange={(e) =>
                              setPreviewValues({ ...previewValues, [f.id]: e.target.value })
                            }
                          />
                        )}

                        {f.helpText && (
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            {f.helpText}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="submit"
                    className="btn-admin-primary"
                    style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
                  >
                    Test Preview Interaction
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormBuilder;
