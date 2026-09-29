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

  // Convert to Order
  const handleConvertToOrder = async () => {
    if (!activeSubmission) return;
    const defaultOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const orderId = window.prompt("Enter or confirm the Order Reference ID to link:", defaultOrderId);
    if (!orderId) return;

    try {
      const res = await convertAdminSubmission(activeSubmission._id, orderId);
      const updated = res.data?.data?.submission;
      setActiveSubmission(updated);

      setSubmissions((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...s, status: "converted", convertedOrderId: orderId } : s))
      );

      alert(`Submission marked as CONVERTED and linked to Order Ref: ${orderId}`);
    } catch (err) {
      alert("Failed to convert submission.");
    }
  };

  // WhatsApp click-to-chat
  const getWhatsAppUrl = (submission) => {
    const rawPhone = submission.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hello ${submission.name}! Thank you for your ${submission.formKey.toUpperCase()} decoration request with Decor Joy Gurgaon. I'd love to help finalize your setup design. How may we assist you today?`
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
                <th>Purpose</th>
                <th>Event Date / Slot</th>
                <th>Submitted (IST)</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const eventDate =
                  sub.answers?.event_date ||
                  sub.answers?.eventDate ||
                  sub.answersSnapshot?.find((s) => s.fieldId === "event_date" || s.fieldId === "eventDate")?.value;

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
                          {sub.name || "Customer"}
                        </strong>
                      </button>
                      <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                        📞 {sub.phone}
                      </div>
                      {sub.email && (
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          ✉️ {sub.email}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="badge-gold" style={{ textTransform: "capitalize" }}>
                        {sub.formKey.replace(/-/g, " ")}
                      </span>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                        v{sub.formVersion}
                      </div>
                    </td>

                    <td style={{ fontSize: "0.85rem", color: "#334155" }}>
                      {eventDate ? String(eventDate) : "—"}
                    </td>

                    <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      {new Date(sub.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
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
                        <option value="lost">Lost</option>
                      </select>
                    </td>

                    <td style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {sub.assignedTo || "—"}
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
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
                          }}
                          title="Open WhatsApp chat"
                        >
                          <span>💬</span> WhatsApp
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
            style={{ maxWidth: "800px", width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  {activeSubmission.name} -{" "}
                  <span style={{ textTransform: "capitalize", color: "#b88932" }}>
                    {activeSubmission.formKey.replace(/-/g, " ")}
                  </span>
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Ref: {activeSubmission._id} • Version: v{activeSubmission.formVersion}
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

              {/* Status and Action Ribbon */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "14px",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  padding: "14px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
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
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                    Staff:
                  </span>
                  <input
                    type="text"
                    className="fb-input"
                    style={{ width: "130px", padding: "4px 8px" }}
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

                <div style={{ display: "flex", gap: "8px" }}>
                  <a
                    href={getWhatsAppUrl(activeSubmission)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-admin-primary"
                    style={{
                      background: "#25d366",
                      fontSize: "0.82rem",
                      padding: "6px 12px",
                      textDecoration: "none",
                    }}
                  >
                    <span>💬</span> WhatsApp
                  </a>

                  {activeSubmission.status !== "converted" ? (
                    <button
                      type="button"
                      className="btn-admin-primary"
                      style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                      onClick={handleConvertToOrder}
                    >
                      🎯 Convert to Order
                    </button>
                  ) : (
                    <span
                      style={{
                        padding: "6px 12px",
                        background: "#dcfce7",
                        color: "#166534",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      ✓ Order Ref: {activeSubmission.convertedOrderId}
                    </span>
                  )}
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
