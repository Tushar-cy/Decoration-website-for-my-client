import React, { useState, useEffect } from "react";
import { getInquiries, updateInquiry, deleteInquiry } from "../services/api";

function InquiryManager() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadInquiries(statusFilter);
  }, [statusFilter]);

  const loadInquiries = async (filter) => {
    try {
      setLoading(true);
      const res = await getInquiries(filter);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setInquiries(list);
    } catch (error) {
      console.error("Error loading inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateInquiry(id, { status: newStatus });
      loadInquiries(statusFilter);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer inquiry?")) {
      try {
        await deleteInquiry(id);
        loadInquiries(statusFilter);
      } catch (error) {
        alert("Failed to delete inquiry");
      }
    }
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Customer Inquiries & Leads</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Track bookings received through the customer website and WhatsApp.
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["All", "new", "contacted", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: statusFilter === st ? "#0f172a" : "#ffffff",
                color: statusFilter === st ? "#ffffff" : "#475569",
                cursor: "pointer",
                fontSize: "0.85rem",
                textTransform: "capitalize",
                fontWeight: "500",
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <p style={{ padding: "24px", color: "#64748b" }}>Loading inquiries...</p>
        ) : inquiries.length === 0 ? (
          <p style={{ padding: "24px", color: "#64748b" }}>No inquiries matching this filter.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Message / Details</th>
                <th>Status</th>
                <th>Reply on WhatsApp</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => {
                const digits = (inq.phone || "").replace(/[^0-9]/g, "");
                const local10 = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
                const waMessage = encodeURIComponent(
                  `Hello ${inq.name}! Thank you for inquiring with Decor Joy Gurgaon for your ${inq.eventType} on ${inq.eventDate}. How may we assist you with the decorations?`
                );
                const waUrl = `https://wa.me/91${local10}?text=${waMessage}`;

                return (
                  <tr key={inq._id}>
                    <td>
                      <strong>{inq.name}</strong>
                      <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        📞 {inq.phone}
                      </div>
                      {inq.email && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          ✉️ {inq.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge-gold">{inq.eventType}</span>
                    </td>
                    <td>
                      {inq.eventDate ? new Date(inq.eventDate).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td style={{ fontSize: "0.85rem", maxWidth: "260px", color: "#475569" }}>
                      {inq.message || "—"}
                    </td>
                    <td>
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                        className={`status-pill status-${inq.status}`}
                        style={{ border: "1px solid #cbd5e1", outline: "none", cursor: "pointer" }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-action-edit"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                      >
                        <span>💬</span> Chat
                      </a>
                    </td>
                    <td>
                      <button
                        className="btn-action-delete"
                        onClick={() => handleDelete(inq._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InquiryManager;
