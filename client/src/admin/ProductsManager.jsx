import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminProducts,
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  restoreAdminProduct,
  duplicateAdminProduct,
  bulkUpdateProductStatus,
  getUploadSignature,
  getPublicCategories,
  getPublicAddOns,
} from "../services/api";
import { useUndoToast } from "./context/UndoToastContext";
import { useAdminUser } from "./hooks/useAdminUser";

function ProductsManager() {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();
  const { currentUser } = useAdminUser();
  const isOwner = currentUser?.role === "owner";

  // Filters & Pagination
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["adminProducts", page, categoryFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        q: searchQuery.trim() || undefined,
      };
      const res = await getAdminProducts(params);
      return res.data?.data;
    },
    staleTime: 30000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["publicCategories"],
    queryFn: async () => {
      const res = await getPublicCategories();
      return res.data?.data?.categories || [];
    },
  });

  const { data: addOns = [] } = useQuery({
    queryKey: ["publicAddOns"],
    queryFn: async () => {
      const res = await getPublicAddOns();
      return res.data?.data?.addOns || [];
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (product) => {
      if (product._id) {
        return updateAdminProduct(product._id, product);
      }
      return createAdminProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      setIsEditorOpen(false);
      setEditingProduct(null);
      alert("Product saved successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || "Failed to save product.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminProduct(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      // 8-second Undo Toast
      showUndoToast({
        message: "Product soft deleted.",
        onUndo: async () => {
          await restoreAdminProduct(id);
          queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
        },
      });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || "Delete failed.");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => duplicateAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      alert("Product duplicated as draft!");
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, isActive }) => bulkUpdateProductStatus(ids, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      setSelectedIds([]);
      alert("Bulk status updated!");
    },
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || { page: 1, totalPages: 1 };

  // New Product Template
  const handleOpenNew = () => {
    setEditingProduct({
      title: "",
      slug: "",
      categoryId: categories[0]?._id || "",
      shortDescription: "",
      description: "",
      basePricePaise: 499900,
      compareAtPricePaise: null,
      images: [],
      variants: [],
      includedItems: [""],
      addOnIds: [],
      setupMinutes: 90,
      minLeadHours: 24,
      badge: "",
      isActive: true,
      isFeatured: false,
      tags: [],
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (prod) => {
    setEditingProduct(JSON.parse(JSON.stringify(prod)));
    setIsEditorOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Soft delete this product? (You can undo for 8 seconds)")) {
      deleteMutation.mutate(id);
    }
  };

  // Signed Cloudinary Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      // 1. Request signature from server
      const sigRes = await getUploadSignature("decorjoy/products");
      const { timestamp, signature, apiKey, cloudName, folder } = sigRes.data?.data;

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();

      if (data.secure_url) {
        setEditingProduct((prev) => ({
          ...prev,
          images: [
            ...(prev.images || []),
            { url: data.secure_url, publicId: data.public_id, alt: prev.title || "Decor Setup" },
          ],
        }));
      } else {
        alert("Image upload failed");
      }
    } catch (err) {
      alert("Upload failed. In development without Cloudinary credentials, a mock URL will be added.");
      // Fallback in test/dev
      setEditingProduct((prev) => ({
        ...prev,
        images: [
          ...(prev.images || []),
          {
            url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
            publicId: "mock_id",
            alt: prev.title || "Decor Setup",
          },
        ],
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Products & Packages Catalog</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Create and edit event decoration packages, add-ons, pricing in paise, and Cloudinary galleries.
          </p>
        </div>

        <button type="button" className="btn-admin-primary" onClick={handleOpenNew}>
          ➕ Add New Package
        </button>
      </div>

      {/* Filter and Bulk Bar */}
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="fb-select"
            style={{ width: "auto" }}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="fb-select"
            style={{ width: "auto" }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Draft</option>
          </select>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="btn-action-edit"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, isActive: true })}
              >
                Activate ({selectedIds.length})
              </button>
              <button
                type="button"
                className="btn-action-edit"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, isActive: false })}
              >
                Deactivate ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="fb-input"
            style={{ width: "200px" }}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-card">
        {isLoading ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading catalog...</p>
        ) : products.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No products found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? products.map((p) => p._id) : [])
                    }
                  />
                </th>
                <th>Setup Preview</th>
                <th>Package Title</th>
                <th>Category</th>
                <th>Price (INR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(prod._id)}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, prod._id] : prev.filter((id) => id !== prod._id)
                        )
                      }
                    />
                  </td>

                  <td>
                    <img
                      src={prod.images?.[0]?.url || "/decor-gallery/decor_001.jpg"}
                      alt={prod.title}
                      className="admin-image-thumb"
                    />
                  </td>

                  <td>
                    <strong>{prod.title}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>slug: {prod.slug}</div>
                    {prod.badge && <span className="badge-gold">{prod.badge}</span>}
                  </td>

                  <td>{prod.categoryId?.name || "General"}</td>

                  <td>
                    <strong>₹{(prod.basePricePaise / 100).toLocaleString("en-IN")}</strong>
                    {prod.compareAtPricePaise && (
                      <div style={{ fontSize: "0.75rem", textDecoration: "line-through", color: "#94a3b8" }}>
                        ₹{(prod.compareAtPricePaise / 100).toLocaleString("en-IN")}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className={`status-pill ${prod.isActive ? "status-completed" : "status-lost"}`}>
                      {prod.isActive ? "Active" : "Draft"}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEdit(prod)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => duplicateMutation.mutate(prod._id)}
                        title="Duplicate as Draft"
                      >
                        Copy
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDelete(prod._id)}
                          title="Soft Delete"
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
        )}
      </div>

      {/* CREATE / EDIT MODAL & LIVE PREVIEW */}
      {isEditorOpen && editingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setIsEditorOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "900px", width: "95%", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingProduct._id ? `Edit: ${editingProduct.title}` : "New Decoration Package"}
              </h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-action-edit"
                  onClick={() => setPreviewOpen(!previewOpen)}
                >
                  {previewOpen ? "Hide Customer Preview" : "👁️ Customer Preview"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", gap: "24px", flexDirection: previewOpen ? "row" : "column" }}>
              {/* Form Editor Columns */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="fb-field-grid">
                  <div className="fb-input-group">
                    <label className="fb-input-label">Title *</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingProduct.title}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          title: e.target.value,
                          slug: editingProduct._id
                            ? editingProduct.slug
                            : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        })
                      }
                    />
                  </div>

                  <div className="fb-input-group">
                    <label className="fb-input-label">Slug (URL identifier) *</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingProduct.slug}
                      onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    />
                  </div>

                  <div className="fb-input-group">
                    <label className="fb-input-label">Category *</label>
                    <select
                      className="fb-select"
                      value={editingProduct.categoryId?._id || editingProduct.categoryId}
                      onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fb-input-group">
                    <label className="fb-input-label">Base Price (in Paise) *</label>
                    <input
                      type="number"
                      className="fb-input"
                      placeholder="e.g. 599900 = ₹5,999"
                      value={editingProduct.basePricePaise}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, basePricePaise: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="fb-input-group">
                  <label className="fb-input-label">Short Description</label>
                  <input
                    type="text"
                    className="fb-input"
                    value={editingProduct.shortDescription || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  />
                </div>

                <div className="fb-input-group">
                  <label className="fb-input-label">Full Description *</label>
                  <textarea
                    className="fb-textarea"
                    rows={4}
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>

                {/* Cloudinary Multi-Image Upload */}
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span className="fb-input-label">Product Images (Cloudinary)</span>
                    <label className="btn-admin-primary" style={{ padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}>
                      {uploadingImage ? "Uploading..." : "📷 Upload Image"}
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {(editingProduct.images || []).map((img, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img src={img.url} alt={img.alt} className="admin-image-thumb" style={{ width: "70px", height: "70px" }} />
                        <button
                          type="button"
                          onClick={() => {
                            const images = [...editingProduct.images];
                            images.splice(idx, 1);
                            setEditingProduct({ ...editingProduct, images });
                          }}
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics */}
                <div className="fb-field-grid">
                  <div className="fb-input-group">
                    <label className="fb-input-label">Setup Time (Minutes)</label>
                    <input
                      type="number"
                      className="fb-input"
                      value={editingProduct.setupMinutes}
                      onChange={(e) => setEditingProduct({ ...editingProduct, setupMinutes: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>

                  <div className="fb-input-group">
                    <label className="fb-input-label">Min Lead Time (Hours)</label>
                    <input
                      type="number"
                      className="fb-input"
                      value={editingProduct.minLeadHours}
                      onChange={(e) => setEditingProduct({ ...editingProduct, minLeadHours: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>

                  <div className="fb-input-group">
                    <label className="fb-input-label">Badge Label (e.g. Luxury Pick)</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingProduct.badge || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={editingProduct.isActive}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    />
                    Active in Storefront
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    />
                    Featured on Homepage
                  </label>
                </div>
              </div>

              {/* Live Customer Preview Panel */}
              {previewOpen && (
                <div style={{ width: "320px", borderLeft: "1px solid #e2e8f0", paddingLeft: "20px" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>
                    Customer View Preview
                  </h4>
                  <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <img
                      src={editingProduct.images?.[0]?.url || "https://placehold.co/320x200"}
                      alt={editingProduct.title}
                      style={{ width: "100%", height: "180px", objectFit: "cover" }}
                    />
                    <div style={{ padding: "14px" }}>
                      <span className="badge-gold">{editingProduct.badge || "Standard"}</span>
                      <h4 style={{ fontSize: "1rem", marginTop: "6px" }}>{editingProduct.title || "Untitled Package"}</h4>
                      <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{editingProduct.shortDescription}</p>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#b88932", marginTop: "10px" }}>
                        ₹{((editingProduct.basePricePaise || 0) / 100).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-action-edit" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => saveMutation.mutate(editingProduct)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsManager;
