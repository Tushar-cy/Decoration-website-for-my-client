import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPublicCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  restoreAdminCategory,
  getPublicAddOns,
  createAdminAddOn,
  updateAdminAddOn,
  deleteAdminAddOn,
  restoreAdminAddOn,
} from "../services/api";
import { useUndoToast } from "./context/UndoToastContext";
import { useAdminUser } from "./hooks/useAdminUser";
import { useSearchParams } from "react-router-dom";

function CategoriesManager() {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();
  const { currentUser } = useAdminUser();
  const isOwner = currentUser?.role === "owner";
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "categories"
  ); // 'categories' | 'addons'

  // Modal states
  const [modalType, setModalType] = useState(null); // 'category' | 'addon' | null
  const [editingItem, setEditingItem] = useState(null);

  // Queries
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: async () => {
      const res = await getPublicCategories();
      return res.data?.data?.categories || [];
    },
  });

  const { data: addOns = [], isLoading: addOnLoading } = useQuery({
    queryKey: ["adminAddOns"],
    queryFn: async () => {
      const res = await getPublicAddOns();
      return res.data?.data?.addOns || [];
    },
  });

  // Mutations - Categories
  const categorySave = useMutation({
    mutationFn: (cat) => (cat._id ? updateAdminCategory(cat._id, cat) : createAdminCategory(cat)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      setModalType(null);
    },
  });

  const categoryDelete = useMutation({
    mutationFn: (id) => deleteAdminCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      showUndoToast({
        message: "Category soft-deleted",
        onUndo: () =>
          restoreAdminCategory(id).then(() =>
            queryClient.invalidateQueries({ queryKey: ["adminCategories"] })
          ),
      });
    },
  });

  // Mutations - AddOns
  const addOnSave = useMutation({
    mutationFn: (addon) => (addon._id ? updateAdminAddOn(addon._id, addon) : createAdminAddOn(addon)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAddOns"] });
      setModalType(null);
    },
  });

  const addOnDelete = useMutation({
    mutationFn: (id) => deleteAdminAddOn(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["adminAddOns"] });
      showUndoToast({
        message: "Add-On soft-deleted",
        onUndo: () =>
          restoreAdminAddOn(id).then(() =>
            queryClient.invalidateQueries({ queryKey: ["adminAddOns"] })
          ),
      });
    },
  });

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Categories & Add-Ons</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Configure event celebration categories and custom optional add-ons (fairy lights, cakes, backdrops).
          </p>
        </div>

        <div>
          {activeTab === "categories" && (
            <button
              type="button"
              className="btn-admin-primary"
              onClick={() => {
                setEditingItem({ name: "", slug: "", image: "", sortOrder: 0 });
                setModalType("category");
              }}
            >
              ➕ Add Category
            </button>
          )}

          {activeTab === "addons" && (
            <button
              type="button"
              className="btn-admin-primary"
              onClick={() => {
                setEditingItem({ name: "", pricePaise: 49900, image: "", isActive: true });
                setModalType("addon");
              }}
            >
              ➕ Add Add-On
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="fb-tabs-bar">
        <button
          type="button"
          className={`fb-tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          🏷️ Categories ({categories.length})
        </button>
        <button
          type="button"
          className={`fb-tab-btn ${activeTab === "addons" ? "active" : ""}`}
          onClick={() => setActiveTab("addons")}
        >
          ✨ Add-Ons ({addOns.length})
        </button>
      </div>

      {/* TAB 1: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{c.slug}</td>
                  <td>{c.sortOrder}</td>
                  <td>
                    <span className={`status-pill ${c.isActive ? "status-completed" : "status-lost"}`}>
                      {c.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => {
                          setEditingItem(c);
                          setModalType("category");
                        }}
                      >
                        Edit
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => categoryDelete.mutate(c._id)}
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

      {/* TAB 2: ADD-ONS */}
      {activeTab === "addons" && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Add-On Name</th>
                <th>Indicative Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addOns.map((a) => (
                <tr key={a._id}>
                  <td>
                    <strong>{a.name}</strong>
                  </td>
                  <td>₹{((a.pricePaise || 0) / 100).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`status-pill ${a.isActive ? "status-completed" : "status-lost"}`}>
                      {a.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => {
                          setEditingItem(a);
                          setModalType("addon");
                        }}
                      >
                        Edit
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => addOnDelete.mutate(a._id)}
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

      {/* Edit / Create Modal */}
      {modalType && editingItem && (
        <div className="admin-modal-backdrop" onClick={() => setModalType(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {editingItem._id ? "Edit" : "Create"}{" "}
                {modalType === "category" ? "Category" : "Add-On"}
              </h3>
              <button type="button" className="close-btn" onClick={() => setModalType(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {modalType === "category" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Category Name</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Slug</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingItem.slug}
                      onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                    />
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Sort Order</label>
                    <input
                      type="number"
                      className="fb-input"
                      value={editingItem.sortOrder}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>
              )}

              {modalType === "addon" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Add-On Name</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Indicative Price (in Paise, ₹100 = 10000)</label>
                    <input
                      type="number"
                      className="fb-input"
                      value={editingItem.pricePaise}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, pricePaise: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-action-edit" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => {
                  if (modalType === "category") categorySave.mutate(editingItem);
                  if (modalType === "addon") addOnSave.mutate(editingItem);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesManager;
