import React, { useState, useEffect } from "react";
import {
  getAdminSubmissions,
  getAdminSubmission,
  updateAdminSubmissionStatus,
  addAdminSubmissionNote,
  assignAdminSubmission,
  convertAdminSubmission,
  getActivePurposes,
} from "../services/api";

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function SubmissionsManager() {
  const [submissions, setSubmissions] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [selectedPurpose, setSelectedPurpose] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Modal Detail
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Load purposes for dropdown
    getActivePurposes()
      .then((res) => {
        setPurposes(res.data?.data?.purposes || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadSubmissions(1);
  }, [selectedPurpose, selectedStatus]);

  const loadSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        formKey: selectedPurpose !== "all" ? selectedPurpose : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
      };

      const res = await getAdminSubmissions(params);
      const list = res.data?.data?.submissions || [];
      const pag = res.data?.data?.pagination || { page: 1, limit: 20, total: list.length, totalPages: 1 };

      setSubmissions(list);
      setPagination(pag);
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSubmissions(1);
  };

  // Open Detail Drawer
  const openDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await getAdminSubmission(id);
      const sub = res.data?.data?.submission;
      setActiveSubmission(sub);
      setAssigneeInput(sub.assignedTo || "");
      setNewNoteText("");
    } catch (err) {
      alert("Failed to load submission details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setActiveSubmission(null);
    setFeedback(null);
  };

  // Status Change
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateAdminSubmissionStatus(id, newStatus);
      const updated = res.data?.data?.submission;

      // Update in local list
      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: updated.status } : s))
      );

      if (activeSubmission && activeSubmission._id === id) {
        setActiveSubmission({ ...activeSubmission, status: updated.status });
      }

      setFeedback({ type: "success", message: `Status updated to ${newStatus}` });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to update status." });
    }
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeSubmission) return;

    try {
      const res = await addAdminSubmissionNote(activeSubmission._id, newNoteText.trim());
      const updated = res.data?.data?.submission;
      setActiveSubmission(updated);
      setNewNoteText("");
      setFeedback({ type: "success", message: "Internal note added." });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to add note." });
    }
  };

  // Assign Staff
  const handleAssign = async () => {
    if (!activeSubmission) return;
    try {
      const res = await assignAdminSubmission(activeSubmission._id, assigneeInput.trim());
      const updated = res.data?.data?.submission;
      setActiveSubmission(updated);

      // Update local list
      setSubmissions((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...s, assignedTo: updated.assignedTo } : s))
      );

      setFeedback({ type: "success", message: `Assigned to ${updated.assignedTo || "None"}` });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to assign staff." });
    }
  };

  // Mark as Converted (Deal Closed / Won)
  const handleMarkConverted = async () => {
    if (!activeSubmission) return;
    const defaultRef = `REF-${Date.now().toString().slice(-6)}`;
    const ref = window.prompt("Enter an optional conversion reference (e.g. client name or deal note):", defaultRef);
    if (ref === null) return;

    try {
      const res = await convertAdminSubmission(activeSubmission._id, { conversionRef: ref || defaultRef });
      const updated = res.data?.data?.submission;
      setActiveSubmission(updated);

      setSubmissions((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...s, status: "converted", conversionRef: ref || defaultRef } : s))
      );

      alert(`Lead marked as CONVERTED! Ref: ${ref || defaultRef}`);
    } catch (err) {
      alert("Failed to mark submission as converted.");
    }
  };

  // Helper to extract key fields (customer, occasion, date, location, budget) from schema answers
  const extractSubmissionSummary = (sub) => {
    if (!sub) {
      return { customerName: "", customerPhone: "", customerEmail: "", occasion: "", date: "—", location: "Gurgaon", budget: "Indicative", preferences: "" };
    }
    const answers = sub.answers || {};
    const snapshot = sub.answersSnapshot || [];

    const getVal = (keys) => {
      for (const k of keys) {
        if (answers[k] !== undefined && answers[k] !== null && answers[k] !== "") return answers[k];
        const snap = snapshot.find((s) => s.fieldId === k);
        if (snap?.value !== undefined && snap?.value !== null && snap?.value !== "") return snap.value;
      }
      return null;
    };

    const customerName = sub.name || getVal(["name", "fullName", "celebrant_name"]) || "Customer";
    const customerPhone = sub.phone || getVal(["phone", "whatsapp", "mobile"]) || "";
    const customerEmail = sub.email || getVal(["email"]) || "";

    const occasion =
      getVal(["occasion", "event_type", "purpose", "theme"]) ||
      (sub.formKey ? sub.formKey.replace(/-/g, " ") : "Celebration");

    const date =
      getVal(["event_date", "eventDate", "preferred_date", "date", "celebration_date"]) || "Flexible";

    const location =
      getVal(["location", "venue_address", "pincode", "venue_type", "address", "area", "condo"]) ||
      "Gurgaon";

    const budget =
      getVal(["budget", "approximate_budget", "budget_range", "price_range"]) || "Custom Quote";

    const preferences =
      getVal(["theme", "colours", "custom_theme_desc", "special_requests", "notes", "requirements"]) || "";

    return {
      customerName,
      customerPhone,
      customerEmail,
      occasion,
      date,
      location,
      budget,
      preferences,
    };
  };

  // Click-to-call link
  const getCallHref = (submission) => {
    const rawPhone = submission.phone || "";
    const cleanPhone = rawPhone.replace(/[^\d+]/g, "");
    return `tel:${cleanPhone}`;
  };

  // WhatsApp click-to-chat
  const getWhatsAppUrl = (submission) => {
    const rawPhone = submission.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const summary = extractSubmissionSummary(submission);
    const msg = encodeURIComponent(
      `Hello ${submission.name}! Thank you for submitting your ${summary.occasion.toUpperCase()} decoration enquiry with Decor Joy Gurgaon. We'd love to share customized decor mockups and pricing options with you. How may we assist you today?`
    );
    return `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${msg}`;
  };

  // CSV Export URL
  const getExportUrl = () => {
    const params = new URLSearchParams();
    if (selectedPurpose !== "all") params.append("formKey", selectedPurpose);
    if (selectedStatus !== "all") params.append("status", selectedStatus);
    return `/api/admin/submissions/export.csv?${params.toString()}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Submissions Inbox</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Track and convert customer requests submitted through all purpose forms.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a
            href={getExportUrl()}
            download="submissions-export.csv"
            className="btn-action-edit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              background: "#ffffff",
              padding: "8px 14px",
            }}
          >
            <span>📥</span> Export CSV
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Purpose Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}>
              Purpose:
            </span>
            <select
              className="fb-select"
              style={{ width: "auto", minWidth: "150px", padding: "6px 10px" }}
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
            >
              <option value="all">All Purposes</option>
              {purposes.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.title}
                </option>
              ))}
              <option value="legacy-inquiry">Legacy Inquiries</option>
            </select>
          </div>

          {/* Status Pipeline Chips */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {STATUSES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setSelectedStatus(st.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: selectedStatus === st.value ? "#0f172a" : "#ffffff",
                  color: selectedStatus === st.value ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="fb-input"
            style={{ width: "220px", padding: "6px 10px" }}
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="btn-admin-primary"
            style={{ padding: "6px 14px", fontSize: "0.82rem" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Submissions Table */}
      <div className="admin-table-card">
        {loading ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
            Loading submissions...
          </p>
        ) : submissions.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
            No submissions found matching the selected filters.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Occasion</th>
                <th>Event Date / Slot</th>
                <th>Location & Budget</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const summary = extractSubmissionSummary(sub);

                return (
                  <tr key={sub._id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => openDetail(sub._id)}
                        style={{
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <strong style={{ color: "#0f172a", fontSize: "0.92rem", textDecoration: "underline" }}>
                          {summary.customerName}
                        </strong>
                      </button>
                      <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                        📞 {summary.customerPhone}
                      </div>
                      {summary.customerEmail && (
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          ✉️ {summary.customerEmail}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="badge-gold" style={{ textTransform: "capitalize" }}>
                        {summary.occasion}
                      </span>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                        v{sub.formVersion}
                      </div>
                    </td>

                    <td style={{ fontSize: "0.85rem", color: "#334155" }}>
                      📅 {summary.date}
                    </td>

                    <td style={{ fontSize: "0.82rem", color: "#475569" }}>
                      <div>📍 {summary.location}</div>
                      <div style={{ color: "#b88932", fontWeight: 600, marginTop: "2px" }}>
                        💰 {summary.budget}
                      </div>
                    </td>

                    <td>
                      <select
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                        className={`status-pill status-${sub.status}`}
                        style={{ border: "1px solid #cbd5e1", outline: "none", cursor: "pointer" }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="quoted">Quoted</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                        <option value="spam">Spam</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <a
                          href={getWhatsAppUrl(sub)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-action-edit"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                            padding: "4px 8px",
                            fontSize: "0.78rem",
                            background: "#25d366",
                            color: "#ffffff",
                            borderColor: "#25d366",
                          }}
                          title="Open WhatsApp chat"
                        >
                          <span>💬</span> WhatsApp
                        </a>

                        <a
                          href={getCallHref(sub)}
                          className="btn-action-edit"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                            padding: "4px 8px",
                            fontSize: "0.78rem",
                            background: "#0284c7",
                            color: "#ffffff",
                            borderColor: "#0284c7",
                          }}
                          title="Call Customer"
                        >
                          <span>📞</span> Call
                        </a>

                        <button
                          type="button"
                          className="btn-action-edit"
                          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          onClick={() => openDetail(sub._id)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #e2e8f0",
              background: "#fafafa",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn-action-edit"
                disabled={pagination.page <= 1}
                onClick={() => loadSubmissions(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-action-edit"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadSubmissions(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal / Drawer */}
      {activeSubmission && (
        <div className="admin-modal-backdrop" onClick={closeDetail}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "840px", width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  {activeSubmission.name} —{" "}
                  <span style={{ textTransform: "capitalize", color: "#b88932" }}>
                    {activeSubmission.formKey.replace(/-/g, " ")}
                  </span>
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Ref: {activeSubmission._id} • Version: v{activeSubmission.formVersion} • Submitted:{" "}
                  {new Date(activeSubmission.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {feedback && (
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    backgroundColor: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
                    color: feedback.type === "success" ? "#166534" : "#991b1b",
                    fontSize: "0.85rem",
                  }}
                >
                  {feedback.message}
                </div>
              )}

              {/* Executive Summary Card (Who, Occasion, Date, Location, Budget, Status) */}
              {(() => {
                const summary = extractSubmissionSummary(activeSubmission);
                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                      gap: "12px",
                      background: "#fffaf0",
                      border: "1px solid rgba(184, 137, 50, 0.35)",
                      borderRadius: "10px",
                      padding: "16px",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#8c6424", textTransform: "uppercase", fontWeight: 700 }}>
                        👤 Customer
                      </div>
                      <div style={{ fontWeight: 700, color: "#1a221f", fontSize: "0.95rem" }}>
                        {summary.customerName}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                        {summary.customerPhone}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#8c6424", textTransform: "uppercase", fontWeight: 700 }}>
                        🎉 Occasion
                      </div>
                      <div style={{ fontWeight: 700, color: "#1a221f", fontSize: "0.95rem", textTransform: "capitalize" }}>
                        {summary.occasion}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        v{activeSubmission.formVersion}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#8c6424", textTransform: "uppercase", fontWeight: 700 }}>
                        📅 Preferred Date
                      </div>
                      <div style={{ fontWeight: 700, color: "#1a221f", fontSize: "0.95rem" }}>
                        {summary.date}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#8c6424", textTransform: "uppercase", fontWeight: 700 }}>
                        📍 Location / Area
                      </div>
                      <div style={{ fontWeight: 700, color: "#1a221f", fontSize: "0.95rem" }}>
                        {summary.location}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#8c6424", textTransform: "uppercase", fontWeight: 700 }}>
                        💰 Approx. Budget
                      </div>
                      <div style={{ fontWeight: 700, color: "#b88932", fontSize: "0.95rem" }}>
                        {summary.budget}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#8c6424", textTransform: "uppercase", fontWeight: 700 }}>
                        ⚡ Current Status
                      </div>
                      <div>
                        <span className={`status-pill status-${activeSubmission.status}`}>
                          {activeSubmission.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Direct Actions Toolbar: WhatsApp, Call, Mark Contacted, Mark Converted, Close */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {/* Action 1: WhatsApp */}
                  <a
                    href={getWhatsAppUrl(activeSubmission)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-admin-primary"
                    style={{
                      background: "#25d366",
                      fontSize: "0.85rem",
                      padding: "8px 14px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>💬</span> WhatsApp
                  </a>

                  {/* Action 2: Call */}
                  <a
                    href={getCallHref(activeSubmission)}
                    className="btn-admin-primary"
                    style={{
                      background: "#0284c7",
                      fontSize: "0.85rem",
                      padding: "8px 14px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>📞</span> Call
                  </a>

                  {/* Action 3: Mark Contacted */}
                  {activeSubmission.status === "new" && (
                    <button
                      type="button"
                      className="btn-action-edit"
                      style={{ fontSize: "0.85rem", padding: "8px 14px", fontWeight: 600 }}
                      onClick={() => handleStatusChange(activeSubmission._id, "contacted")}
                    >
                      ✓ Mark Contacted
                    </button>
                  )}

                  {/* Action 4: Mark Converted */}
                  {activeSubmission.status !== "converted" ? (
                    <button
                      type="button"
                      className="btn-admin-primary"
                      style={{ fontSize: "0.85rem", padding: "8px 14px", background: "#b88932" }}
                      onClick={() => handleMarkConverted(activeSubmission)}
                    >
                      🎯 Mark Converted
                    </button>
                  ) : (
                    <span
                      style={{
                        padding: "8px 14px",
                        background: "#dcfce7",
                        color: "#166534",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      ✓ Converted: {activeSubmission.conversionRef || "Yes"}
                    </span>
                  )}

                  {/* Action 5: Close */}
                  {activeSubmission.status !== "closed" && (
                    <button
                      type="button"
                      className="btn-action-edit"
                      style={{
                        fontSize: "0.85rem",
                        padding: "8px 14px",
                        color: "#dc2626",
                        borderColor: "#fca5a5",
                      }}
                      onClick={() => handleStatusChange(activeSubmission._id, "closed")}
                    >
                      ✖ Close
                    </button>
                  )}
                </div>

                {/* Status Dropdown & Staff Assignment */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>
                      Status:
                    </span>
                    <select
                      value={activeSubmission.status}
                      onChange={(e) => handleStatusChange(activeSubmission._id, e.target.value)}
                      className={`status-pill status-${activeSubmission.status}`}
                      style={{ border: "1px solid #cbd5e1", outline: "none", cursor: "pointer" }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                      <option value="spam">Spam</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>
                      Staff:
                    </span>
                    <input
                      type="text"
                      className="fb-input"
                      style={{ width: "110px", padding: "4px 8px", fontSize: "0.8rem" }}
                      placeholder="Staff name"
                      value={assigneeInput}
                      onChange={(e) => setAssigneeInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-action-edit"
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                      onClick={handleAssign}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Immutable Snapshot Answers */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                  📋 Customer Responses (Historical Snapshot)
                </h4>
                <div className="sub-answers-grid">
                  {/* Basic Contact Info */}
                  <div className="sub-answer-item">
                    <div className="sub-answer-label">Full Name</div>
                    <div className="sub-answer-value">{activeSubmission.name}</div>
                  </div>
                  <div className="sub-answer-item">
                    <div className="sub-answer-label">Phone Number</div>
                    <div className="sub-answer-value">{activeSubmission.phone}</div>
                  </div>
                  {activeSubmission.email && (
                    <div className="sub-answer-item">
                      <div className="sub-answer-label">Email Address</div>
                      <div className="sub-answer-value">{activeSubmission.email}</div>
                    </div>
                  )}

                  {/* Schema fields from snapshot */}
                  {(activeSubmission.answersSnapshot && activeSubmission.answersSnapshot.length > 0
                    ? activeSubmission.answersSnapshot
                    : Object.entries(activeSubmission.answers || {}).map(([k, v]) => ({
                        fieldId: k,
                        label: k.replace(/_/g, " "),
                        value: v,
                      }))
                  ).map((ans, idx) => (
                    <div key={idx} className="sub-answer-item">
                      <div className="sub-answer-label">{ans.label}</div>
                      <div className="sub-answer-value">
                        {Array.isArray(ans.value)
                          ? ans.value.join(", ")
                          : typeof ans.value === "boolean"
                          ? ans.value ? "Yes" : "No"
                          : String(ans.value || "—")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Notes History */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                  📝 Internal Notes & Logs ({activeSubmission.notes?.length || 0})
                </h4>

                <form onSubmit={handleAddNote} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  <input
                    type="text"
                    className="fb-input"
                    placeholder="Add an internal follow-up note (e.g. called customer, preferred red theme)..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-admin-primary"
                    style={{ whiteSpace: "nowrap", padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    Add Note
                  </button>
                </form>

                {activeSubmission.notes && activeSubmission.notes.length > 0 ? (
                  <div className="sub-notes-list">
                    {activeSubmission.notes.map((note, nIdx) => (
                      <div key={nIdx} className="sub-note-card">
                        <div className="sub-note-meta">
                          <span>👤 {note.by}</span>
                          <span>
                            {new Date(note.at).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <div className="sub-note-text">{note.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                    No notes recorded yet for this submission.
                  </p>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-action-edit" onClick={closeDetail}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionsManager;
