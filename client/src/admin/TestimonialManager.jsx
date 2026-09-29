import React, { useState, useEffect } from "react";
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from "../services/api";

function TestimonialManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "Gurgaon",
    eventType: "Birthday Party",
    review: "",
    rating: 5,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const res = await getTestimonials();
      setTestimonials(res.data);
    } catch (error) {
      console.error("Error loading testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      location: "Gurgaon",
      eventType: "Birthday Party",
      review: "",
      rating: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      location: item.location || "Gurgaon",
      eventType: item.eventType || "Celebration",
      review: item.review,
      rating: item.rating || 5,
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
        await updateTestimonial(editingId, formData);
      } else {
        await createTestimonial(formData);
      }
      handleCloseModal();
      loadTestimonials();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteTestimonial(id);
        loadTestimonials();
      } catch (error) {
        alert("Failed to delete review");
      }
    }
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Manage Customer Testimonials</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Add and curate client reviews displayed on the customer home page.
          </p>
        </div>
        <button className="btn-admin-primary" onClick={handleOpenAdd}>
          <span>➕</span> Add New Review
        </button>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <p style={{ padding: "24px", color: "#64748b" }}>Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <p style={{ padding: "24px", color: "#64748b" }}>No testimonials found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Location / Event</th>
                <th>Rating</th>
                <th>Review Text</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t._id}>
                  <td><strong>{t.name}</strong></td>
                  <td>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {t.eventType} • {t.location}
                    </span>
                  </td>
                  <td style={{ color: "#f59e0b", letterSpacing: "2px" }}>
                    {"★".repeat(t.rating || 5)}
                  </td>
                  <td style={{ fontSize: "0.85rem", maxWidth: "340px", color: "#334155" }}>
                    "{t.review}"
                  </td>
                  <td>
                    <button className="btn-action-edit" onClick={() => handleOpenEdit(t)}>
                      Edit
                    </button>
                    <button className="btn-action-delete" onClick={() => handleDelete(t._id)}>
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
                {editingId ? "Edit Testimonial" : "Add New Testimonial"}
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
                  <label className="form-label">Client Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Priyanka Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location in Gurgaon</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      placeholder="e.g. DLF Phase 4, Gurgaon"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Event Type</label>
                    <input
                      type="text"
                      name="eventType"
                      className="form-control"
                      placeholder="e.g. 1st Birthday Party"
                      value={formData.eventType}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Star Rating (1 to 5)</label>
                  <select
                    name="rating"
                    className="form-control"
                    value={formData.rating}
                    onChange={handleChange}
                  >
                    <option value={5}>5 Stars (★★★★★)</option>
                    <option value={4}>4 Stars (★★★★☆)</option>
                    <option value={3}>3 Stars (★★★☆☆)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Text</label>
                  <textarea
                    name="review"
                    className="form-control"
                    placeholder="Client feedback about setup, punctuality, and balloons..."
                    value={formData.review}
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
                  {editingId ? "Save Changes" : "Create Testimonial"}
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
