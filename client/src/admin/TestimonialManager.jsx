import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminTestimonials,
  createAdminTestimonial,
  updateAdminTestimonial,
  deleteAdminTestimonial,
  toggleAdminTestimonialActive,
} from "../services/api";
import { useUndoToast } from "./context/UndoToastContext";
import { useAdminUser } from "./hooks/useAdminUser";

const EMPTY_FORM = {
  name: "",
  location: "Gurgaon",
  eventType: "Birthday Party",
  review: "",
  rating: 5,
  isActive: true,
  sortOrder: 0,
};

function TestimonialManager() {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();
  const { currentUser } = useAdminUser();
  const isOwner = currentUser?.role === "owner";

  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState(null);

  const queryParams = {
    page,
    limit: 20,
    ...(activeFilter !== "all" && { active: activeFilter }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminTestimonials", queryParams],
    queryFn: async () => {
      const res = await getAdminTestimonials(queryParams);
      return res.data?.data;
    },
    staleTime: 30000,
  });

  // Save (create or update)
  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingItem?._id
        ? updateAdminTestimonial(editingItem._id, payload)
        : createAdminTestimonial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials"] });
      closeEditor();
      setFeedback({ type: "success", message: editingItem ? "Review updated!" : "Review added!" });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.response?.data?.error?.message || "Failed to save testimonial.",
      });
    },
  });

  // Toggle active — optimistic
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleAdminTestimonialActive(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["adminTestimonials", queryParams] });
      const prev = queryClient.getQueryData(["adminTestimonials", queryParams]);
      queryClient.setQueryData(["adminTestimonials", queryParams], (old) => {
        if (!old) return old;
        return {
          ...old,
          testimonials: old.testimonials.map((t) =>
            t._id === id ? { ...t, isActive: !t.isActive } : t
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["adminTestimonials", queryParams], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminTestimonials"] }),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminTestimonial(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials"] });
      showUndoToast({ message: "Testimonial deleted.", onUndo: null });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.response?.data?.error?.message || "Failed to delete.",
      });
    },
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFeedback(null);
    setIsEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      location: item.location || "Gurgaon",
      eventType: item.eventType || "Celebration",
      review: item.review,
      rating: item.rating || 5,
      isActive: item.isActive !== false,
      sortOrder: item.sortOrder || 0,
    });
    setFeedback(null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const testimonials = data?.testimonials || [];
  const pagination = data?.pagination;

  const renderStars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div>
      {/* Header */}
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Customer Testimonials</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Manage reviews shown on the homepage. Toggle active to show/hide without deleting.
          </p>
        </div>
        <button id="testimonial-add-btn" className="btn-admin-primary" onClick={openAdd}>
          ➕ Add Review
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            background: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: feedback.type === "success" ? "#166534" : "#dc2626",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="fb-card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-control"
            style={{ flex: "1 1 160px", maxWidth: "200px" }}
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Reviews</option>
            <option value="true">Visible Only</option>
            <option value="false">Hidden Only</option>
          </select>
          <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
            {pagination?.total || 0} total reviews
          </span>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading testimonials…</div>}
      {error && (
        <div className="fb-card" style={{ color: "#dc2626", background: "#fef2f2" }}>
          Failed to load testimonials.{" "}
          <button className="btn-action-edit" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {testimonials.length === 0 ? (
            <div className="fb-card" style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
              No reviews found.
            </div>
          ) : (
            <div className="admin-table-card">
              {/* Desktop Table */}
              <table className="admin-table" style={{ display: "table" }}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Event / Location</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => (
                    <tr key={t._id} style={{ opacity: t.isActive ? 1 : 0.5 }}>
                      <td>
                        <strong>{t.name}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "#475569" }}>{t.eventType}</div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{t.location}</div>
                      </td>
                      <td>
                        <span style={{ color: "#f59e0b", letterSpacing: "2px", fontSize: "0.9rem" }}>
                          {renderStars(t.rating || 5)}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.84rem", color: "#334155", maxWidth: "320px" }}>
                        "{t.review.slice(0, 100)}{t.review.length > 100 ? "…" : ""}"
                      </td>
                      <td>
                        <button
                          className={`btn-action-toggle ${t.isActive ? "active" : ""}`}
                          onClick={() => toggleActiveMutation.mutate(t._id)}
                          disabled={toggleActiveMutation.isPending}
                          title={t.isActive ? "Click to hide" : "Click to show"}
                        >
                          {t.isActive ? "✅ Visible" : "🙈 Hidden"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button className="btn-action-edit" onClick={() => openEdit(t)}>Edit</button>
                          {isOwner && (
                            <button
                              className="btn-action-delete"
                              onClick={() => {
                                if (window.confirm("Delete this testimonial permanently?")) {
                                  deleteMutation.mutate(t._id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pagination-bar" style={{ marginTop: "24px" }}>
              <button className="btn-action-edit" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span style={{ color: "#64748b", fontSize: "0.88rem" }}>
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn-action-edit"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {isEditorOpen && (
        <div className="admin-modal-backdrop" onClick={closeEditor}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingItem ? "Edit Testimonial" : "Add New Review"}
              </h2>
              <button
                onClick={closeEditor}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Priyanka Sharma"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    minLength={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. DLF Phase 4, Gurgaon"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Type</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 1st Birthday Party"
                      value={form.eventType}
                      onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Star Rating</label>
                  <select
                    className="form-control"
                    value={form.rating}
                    onChange={(e) => setForm((f) => ({ ...f, rating: parseInt(e.target.value, 10) }))}
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                    <option value={2}>2 Stars ★★☆☆☆</option>
                    <option value={1}>1 Star ★☆☆☆☆</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Text *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Client feedback about setup, punctuality, quality…"
                    value={form.review}
                    onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                    required
                    minLength={10}
                  />
                </div>

                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Show on website
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Sort Order (lower = first)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                    min={0}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : editingItem ? "Save Changes" : "Create Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestimonialManager;
