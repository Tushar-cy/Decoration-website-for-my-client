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
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from "../services/api";
import { useUndoToast } from "./context/UndoToastContext";

function CategoriesManager({ currentUser }) {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();
  const isOwner = currentUser?.role === "owner";

  const [activeTab, setActiveTab] = useState("categories"); // 'categories' | 'addons' | 'coupons'

  // Modal states
  const [modalType, setModalType] = useState(null); // 'category' | 'addon' | 'coupon' | null
  const [editingItem, setEditingItem] = useState(null);

  // Queries
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: async () => {
      const res = await getPublicCategories();
      return res.data?.data?.categories || [];
    },
  });

  const { data: addOns = [], isLoading: addonLoading } = useQuery({
    queryKey: ["adminAddOns"],
    queryFn: async () => {
      const res = await getPublicAddOns();
      return res.data?.data?.addOns || [];
    },
  });

  const { data: coupons = [], isLoading: couponLoading } = useQuery({
    queryKey: ["adminCoupons"],
    queryFn: async () => {
      const res = await getAdminCoupons();
      return res.data?.data?.coupons || [];
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
        message: "Category deleted.",
        onUndo: async () => {
          await restoreAdminCategory(id);
          queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
        },
      });
    },
  });

  // Mutations - AddOns
  const addOnSave = useMutation({
    mutationFn: (item) => (item._id ? updateAdminAddOn(item._id, item) : createAdminAddOn(item)),
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
        message: "AddOn deleted.",
        onUndo: async () => {
          await restoreAdminAddOn(id);
          queryClient.invalidateQueries({ queryKey: ["adminAddOns"] });
        },
      });
    },
  });

  // Mutations - Coupons
  const couponSave = useMutation({
    mutationFn: (coup) => (coup._id ? updateAdminCoupon(coup._id, coup) : createAdminCoupon(coup)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
      setModalType(null);
    },
  });

  const couponDelete = useMutation({
    mutationFn: (id) => deleteAdminCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
    },
  });

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Categories, Add-Ons & Coupons</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Configure event categories, cross-sell items (lights, cakes), and discount codes.
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

          {activeTab === "coupons" && (
            <button
              type="button"
              className="btn-admin-primary"
              onClick={() => {
                setEditingItem({
                  code: "",
                  discountType: "percent",
                  discountValue: 10,
                  minOrderValuePaise: 299900,
                  maxDiscountPaise: 100000,
                  isActive: true,
                });
                setModalType("coupon");
              }}
            >
              ➕ Create Coupon
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
        <button
          type="button"
          className={`fb-tab-btn ${activeTab === "coupons" ? "active" : ""}`}
          onClick={() => setActiveTab("coupons")}
        >
          🎟️ Coupons ({coupons.length})
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
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <strong>{cat.name}</strong>
                  </td>
                  <td>{cat.slug}</td>
                  <td>{cat.sortOrder || 0}</td>
                  <td>
                    <span className="status-pill status-completed">Active</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => {
                          setEditingItem(cat);
                          setModalType("category");
                        }}
                      >
                        Edit
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => categoryDelete.mutate(cat._id)}
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
                <th>Add-On Item</th>
                <th>Price (INR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addOns.map((ad) => (
                <tr key={ad._id}>
                  <td>
                    <strong>{ad.name}</strong>
                  </td>
                  <td>₹{((ad.pricePaise || 0) / 100).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`status-pill ${ad.isActive ? "status-completed" : "status-lost"}`}>
                      {ad.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => {
                          setEditingItem(ad);
                          setModalType("addon");
                        }}
                      >
                        Edit
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => addOnDelete.mutate(ad._id)}
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

      {/* TAB 3: COUPONS */}
      {activeTab === "coupons" && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Promo Code</th>
                <th>Type & Value</th>
                <th>Min Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((cp) => (
                <tr key={cp._id}>
                  <td>
                    <strong style={{ color: "#b88932" }}>{cp.code}</strong>
                  </td>
                  <td>
                    {cp.discountType === "percent" ? `${cp.discountValue}% OFF` : `₹${((cp.discountValue || 0) / 100).toFixed(0)} OFF`}
                  </td>
                  <td>₹{((cp.minOrderValuePaise || 0) / 100).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`status-pill ${cp.isActive ? "status-completed" : "status-lost"}`}>
                      {cp.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => {
                          setEditingItem(cp);
                          setModalType("coupon");
                        }}
                      >
                        Edit
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => couponDelete.mutate(cp._id)}
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

      {/* MODAL EDITORS */}
      {modalType && editingItem && (
        <div className="admin-modal-backdrop" onClick={() => setModalType(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {modalType === "category" ? "Category" : modalType === "addon" ? "Add-On" : "Coupon"}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
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
                    <label className="fb-input-label">Price (in Paise)</label>
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

              {modalType === "coupon" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Coupon Code (Uppercase)</label>
                    <input
                      type="text"
                      className="fb-input"
                      value={editingItem.code}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="fb-field-grid">
                    <div className="fb-input-group">
                      <label className="fb-input-label">Discount Type</label>
                      <select
                        className="fb-select"
                        value={editingItem.discountType}
                        onChange={(e) => setEditingItem({ ...editingItem, discountType: e.target.value })}
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (Paise)</option>
                      </select>
                    </div>
                    <div className="fb-input-group">
                      <label className="fb-input-label">Discount Value</label>
                      <input
                        type="number"
                        className="fb-input"
                        value={editingItem.discountValue}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, discountValue: parseInt(e.target.value, 10) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Min Order Value (in Paise)</label>
                    <input
                      type="number"
                      className="fb-input"
                      value={editingItem.minOrderValuePaise}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, minOrderValuePaise: parseInt(e.target.value, 10) || 0 })
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
                  if (modalType === "coupon") couponSave.mutate(editingItem);
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
