import React, { useState, useEffect } from "react";
import { getGallery, createGallery, updateGallery, deleteGallery } from "../services/api";

const CATEGORIES = ["Birthday", "Anniversary", "Baby Shower", "Proposal", "Other"];

function GalleryManager() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Birthday",
    description: "",
    image: "",
  });

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const res = await getGallery();
      setGallery(res.data);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      category: "Birthday",
      description: "",
      image: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || "",
      image: item.image,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateGallery(editingId, formData);
      } else {
        await createGallery(formData);
      }
      handleCloseModal();
      loadGallery();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this photo from the gallery?")) {
      try {
        await deleteGallery(id);
        loadGallery();
      } catch (error) {
        alert("Failed to delete item");
      }
    }
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Manage Gallery Portfolio</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Add, update, or remove portfolio decoration images seen by website visitors.
          </p>
        </div>
        <button className="btn-admin-primary" onClick={handleOpenAdd}>
          <span>➕</span> Add New Photo
        </button>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <p style={{ padding: "24px", color: "#64748b" }}>Loading gallery...</p>
        ) : gallery.length === 0 ? (
          <p style={{ padding: "24px", color: "#64748b" }}>No photos found. Click "Add New Photo" to create one.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Category</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gallery.map((item) => (
                <tr key={item._id}>
                  <td>
                    <img src={item.image} alt={item.title} className="admin-image-thumb" />
                  </td>
                  <td><strong>{item.title}</strong></td>
                  <td>
                    <span className="badge-gold">{item.category}</span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.85rem", maxWidth: "260px" }}>
                    {item.description || "—"}
                  </td>
                  <td>
                    <button className="btn-action-edit" onClick={() => handleOpenEdit(item)}>
                      Edit
                    </button>
                    <button className="btn-action-delete" onClick={() => handleDelete(item._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={handleCloseModal}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingId ? "Edit Gallery Item" : "Add New Gallery Photo"}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">Photo Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="e.g. Chrome Gold Balloon Ring"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    className="form-control"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    className="form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={handleChange}
                    required
                  />
                </div>

                {formData.image && (
                  <div style={{ marginBottom: "16px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Image Preview:</span>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{ maxHeight: "140px", margin: "8px auto 0", borderRadius: "8px", objectFit: "cover" }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Location / Note (Optional)</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder="e.g. Sector 57, Gurugram"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  {editingId ? "Save Changes" : "Add to Gallery"}
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
