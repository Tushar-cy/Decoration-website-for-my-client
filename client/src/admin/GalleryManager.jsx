import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminGallery,
  createAdminGallery,
  updateAdminGallery,
  deleteAdminGallery,
  toggleAdminGalleryActive,
  toggleAdminGalleryFeatured,
  bulkUploadAdminGallery,
  getUploadSignature,
} from "../services/api";
import { useUndoToast } from "./context/UndoToastContext";
import { useAdminUser } from "./hooks/useAdminUser";

const CATEGORIES = ["Birthday", "Anniversary", "Baby Shower", "Proposal", "Corporate", "Other"];

const EMPTY_FORM = {
  title: "",
  category: "Birthday",
  description: "",
  image: "",
  publicId: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

// Upload a single file to Cloudinary via signed upload
async function uploadToCloudinary(file) {
  const sigRes = await getUploadSignature("gallery");
  const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("signature", signature);
  fd.append("timestamp", timestamp);
  fd.append("api_key", apiKey);
  fd.append("folder", folder || "gallery");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) throw new Error("Cloudinary upload failed");
  const result = await response.json();
  return { url: result.secure_url, publicId: result.public_id };
}

function GalleryManager() {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();
  const { currentUser } = useAdminUser();
  const isOwner = currentUser?.role === "owner";

  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Bulk upload state
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const bulkInputRef = useRef(null);

  const queryParams = {
    page,
    limit: 20,
    ...(categoryFilter !== "All" && { category: categoryFilter }),
    ...(activeFilter !== "all" && { active: activeFilter }),
    ...(featuredFilter !== "all" && { featured: "true" }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminGallery", queryParams],
    queryFn: async () => {
      const res = await getAdminGallery(queryParams);
      return res.data?.data;
    },
    staleTime: 20000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingItem?._id ? updateAdminGallery(editingItem._id, payload) : createAdminGallery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminGallery"] });
      closeEditor();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleAdminGalleryActive(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["adminGallery", queryParams] });
      const prev = queryClient.getQueryData(["adminGallery", queryParams]);
      queryClient.setQueryData(["adminGallery", queryParams], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) => (i._id === id ? { ...i, isActive: !i.isActive } : i)),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["adminGallery", queryParams], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminGallery"] }),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (id) => toggleAdminGalleryFeatured(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["adminGallery", queryParams] });
      const prev = queryClient.getQueryData(["adminGallery", queryParams]);
      queryClient.setQueryData(["adminGallery", queryParams], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) => (i._id === id ? { ...i, isFeatured: !i.isFeatured } : i)),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["adminGallery", queryParams], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminGallery"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminGallery(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["adminGallery"] });
      showUndoToast({
        message: "Gallery item deleted.",
        onUndo: null, // hard delete — no restore
      });
    },
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setUploadError(null);
    setIsEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category,
      description: item.description || "",
      image: item.image,
      publicId: item.publicId || "",
      isFeatured: item.isFeatured || false,
      isActive: item.isActive !== false,
      sortOrder: item.sortOrder || 0,
    });
    setUploadError(null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingItem(null);
    setUploading(false);
    setUploadError(null);
  };

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { url, publicId } = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, image: url, publicId }));
    } catch (err) {
      setUploadError("Image upload failed. Paste a URL instead.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.image) return setUploadError("Please add an image.");
    saveMutation.mutate(form);
  };

  // Bulk upload: pick multiple files → Cloudinary one by one → insert all
  const handleBulkFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setBulkUploading(true);
    setBulkProgress({ done: 0, total: files.length, failed: 0 });

    const items = [];
    for (const file of files) {
      try {
        const { url, publicId } = await uploadToCloudinary(file);
        items.push({
          title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          category: "Other",
          image: url,
          publicId,
        });
        setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
      } catch {
        setBulkProgress((p) => ({ ...p, failed: p.failed + 1, done: p.done + 1 }));
      }
    }

    if (items.length > 0) {
      try {
        await bulkUploadAdminGallery(items);
        queryClient.invalidateQueries({ queryKey: ["adminGallery"] });
      } catch {
        // silently handled by error state
      }
    }

    setBulkUploading(false);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
    setTimeout(() => setBulkProgress(null), 4000);
  };

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* Header */}
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Gallery Portfolio</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Manage decoration photos displayed on the customer site.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* Bulk Upload */}
          <label
            className="btn-action-edit"
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {bulkUploading ? (
              <span>
                ⏳ Uploading {bulkProgress?.done}/{bulkProgress?.total}…
              </span>
            ) : (
              <>📦 Bulk Upload</>
            )}
            <input
              ref={bulkInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleBulkFiles}
              disabled={bulkUploading}
            />
          </label>
          <button id="gallery-add-btn" className="btn-admin-primary" onClick={openAdd}>
            ➕ Add Photo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fb-card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-control"
            style={{ flex: "1 1 160px", maxWidth: "200px" }}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="form-control"
            style={{ flex: "1 1 140px", maxWidth: "180px" }}
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Hidden Only</option>
          </select>
          <select
            className="form-control"
            style={{ flex: "1 1 140px", maxWidth: "180px" }}
            value={featuredFilter}
            onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Items</option>
            <option value="true">Featured Only</option>
          </select>
          <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
            {pagination?.total || 0} photos
          </span>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading gallery…</div>}
      {error && (
        <div className="fb-card" style={{ color: "#dc2626", background: "#fef2f2" }}>
          Failed to load gallery.{" "}
          <button className="btn-action-edit" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {/* Masonry-style Image Grid */}
      {!isLoading && !error && (
        <>
          {items.length === 0 ? (
            <div className="fb-card" style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
              No photos found. Click "Add Photo" to get started.
            </div>
          ) : (
            <div className="gallery-admin-grid">
              {items.map((item) => (
                <div key={item._id} className="gallery-admin-card">
                  {/* Image */}
                  <div className="gallery-admin-image-wrap">
                    <img src={item.image} alt={item.title} className="gallery-admin-image" loading="lazy" />
                    {/* Badges */}
                    <div className="gallery-admin-badges">
                      {!item.isActive && (
                        <span className="gallery-badge gallery-badge-hidden">Hidden</span>
                      )}
                      {item.isFeatured && (
                        <span className="gallery-badge gallery-badge-featured">⭐ Featured</span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="gallery-admin-info">
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a", lineHeight: 1.3 }}>
                      {item.title}
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span className="badge-gold" style={{ fontSize: "0.72rem" }}>{item.category}</span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px", lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="gallery-admin-actions">
                    <button
                      className={`btn-action-toggle ${item.isActive ? "active" : ""}`}
                      title={item.isActive ? "Hide from site" : "Show on site"}
                      onClick={() => toggleActiveMutation.mutate(item._id)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {item.isActive ? "👁 Visible" : "🙈 Hidden"}
                    </button>

                    <button
                      className={`btn-action-toggle ${item.isFeatured ? "featured" : ""}`}
                      title={item.isFeatured ? "Unfeature" : "Feature on homepage"}
                      onClick={() => toggleFeaturedMutation.mutate(item._id)}
                      disabled={toggleFeaturedMutation.isPending}
                    >
                      {item.isFeatured ? "⭐" : "☆"}
                    </button>

                    <button className="btn-action-edit" onClick={() => openEdit(item)}>Edit</button>

                    {isOwner && (
                      <button
                        className="btn-action-delete"
                        onClick={() => {
                          if (window.confirm("Delete this photo permanently?")) {
                            deleteMutation.mutate(item._id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pagination-bar" style={{ marginTop: "24px" }}>
              <button
                className="btn-action-edit"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
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

      {/* Add / Edit Drawer */}
      {isEditorOpen && (
        <div className="admin-modal-backdrop" onClick={closeEditor}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingItem ? "Edit Gallery Photo" : "Add New Photo"}
              </h2>
              <button
                onClick={closeEditor}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Photo Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Chrome Gold Balloon Ring Arch"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">Image *</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label
                      className="btn-action-edit"
                      style={{ cursor: "pointer", textAlign: "center", padding: "10px" }}
                    >
                      {uploading ? "⏳ Uploading to Cloudinary…" : "📷 Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageFile}
                        disabled={uploading}
                      />
                    </label>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>or paste URL</div>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://res.cloudinary.com/…"
                      value={form.image}
                      onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    />
                  </div>
                  {uploadError && (
                    <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px" }}>{uploadError}</p>
                  )}
                  {form.image && (
                    <img
                      src={form.image}
                      alt="Preview"
                      style={{ marginTop: "10px", maxHeight: "140px", borderRadius: "8px", objectFit: "cover" }}
                    />
                  )}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Caption / Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sector 57, Gurugram"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    maxLength={500}
                  />
                </div>

                {/* Toggles */}
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Visible on site
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                    />
                    Featured on homepage
                  </label>
                </div>

                {/* Sort Order */}
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
                <button type="submit" className="btn-admin-primary" disabled={saveMutation.isPending || uploading}>
                  {saveMutation.isPending ? "Saving…" : editingItem ? "Save Changes" : "Add to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryManager;
