import React, { useState, useEffect } from "react";
import { getServices, createService, updateService, deleteService } from "../services/api";

const CATEGORIES = [
  "Birthdays",
  "Anniversaries",
  "Baby Showers",
  "Proposals",
  "Special Celebrations",
];

function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Birthdays",
    startingPrice: "",
    image: "",
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await getServices();
      setServices(res.data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      category: "Birthdays",
      startingPrice: "",
      image: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingId(service._id);
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      startingPrice: service.startingPrice,
      image: service.image,
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
        await updateService(editingId, formData);
      } else {
        await createService(formData);
      }
      handleCloseModal();
      loadServices();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(id);
        loadServices();
      } catch (error) {
        alert("Failed to delete service");
      }
    }
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Manage Services & Packages</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Add, update, or remove event decoration offerings displayed on the website.
          </p>
        </div>
        <button className="btn-admin-primary" onClick={handleOpenAdd}>
          <span>➕</span> Add New Service
        </button>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <p style={{ padding: "24px", color: "#64748b" }}>Loading services...</p>
        ) : services.length === 0 ? (
          <p style={{ padding: "24px", color: "#64748b" }}>No services found. Click "Add New Service" to create one.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Starting Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((item) => (
                <tr key={item._id}>
                  <td>
                    <img src={item.image} alt={item.title} className="admin-image-thumb" />
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.description}
                    </div>
                  </td>
                  <td>
                    <span className="badge-gold">{item.category}</span>
                  </td>
                  <td>₹{item.startingPrice?.toLocaleString("en-IN")}</td>
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
                {editingId ? "Edit Decoration Service" : "Add New Decoration Service"}
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
                  <label className="form-label">Service Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="e.g. Pastel Birthday Arch"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
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
                    <label className="form-label">Starting Price (₹)</label>
                    <input
                      type="number"
                      name="startingPrice"
                      className="form-control"
                      placeholder="e.g. 4999"
                      value={formData.startingPrice}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="text"
                    name="image"
                    className="form-control"
                    placeholder="/decor-gallery/decor_001.jpg"
                    value={formData.image}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Describe what is included in this package..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  {editingId ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicesManager;
