import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getServices, getGallery, getInquiries, getTestimonials, updateInquiry } from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    servicesCount: 0,
    galleryCount: 0,
    newInquiriesCount: 0,
    testimonialsCount: 0,
  });

  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [servicesRes, galleryRes, inquiriesRes, testimonialsRes] = await Promise.all([
        getServices(),
        getGallery(),
        getInquiries(),
        getTestimonials(),
      ]);

      const allInquiries = inquiriesRes.data;
      const newInquiries = allInquiries.filter((inq) => inq.status === "new");

      setStats({
        servicesCount: servicesRes.data.length,
        galleryCount: galleryRes.data.length,
        newInquiriesCount: newInquiries.length,
        testimonialsCount: testimonialsRes.data.length,
      });

      setRecentInquiries(allInquiries.slice(0, 5)); // recent 5
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateInquiry(id, { status: newStatus });
      fetchDashboardData();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  return (
    <div>
      <div className="manager-header">
        <h1 className="manager-title">Overview Dashboard</h1>
      </div>

      {/* 4 Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number">{stats.servicesCount}</div>
            <div className="admin-stat-label">Total Services</div>
          </div>
          <div className="admin-stat-icon">🎈</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number">{stats.galleryCount}</div>
            <div className="admin-stat-label">Gallery Photos</div>
          </div>
          <div className="admin-stat-icon">📸</div>
        </div>

        <div className="admin-stat-card" style={{ borderColor: stats.newInquiriesCount > 0 ? "#f59e0b" : "#e2e8f0" }}>
          <div>
            <div className="admin-stat-number" style={{ color: stats.newInquiriesCount > 0 ? "#d97706" : "#0f172a" }}>
              {stats.newInquiriesCount}
            </div>
            <div className="admin-stat-label">New Inquiries</div>
          </div>
          <div className="admin-stat-icon">📩</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number">{stats.testimonialsCount}</div>
            <div className="admin-stat-label">Customer Reviews</div>
          </div>
          <div className="admin-stat-icon">⭐</div>
        </div>
      </div>

      {/* Recent Inquiries Table */}
      <div className="admin-table-card">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Recent Inquiries & Bookings</h2>
          <Link to="/admin/inquiries" style={{ color: "#b88932", fontSize: "0.88rem", fontWeight: "500" }}>
            View All Inquiries →
          </Link>
        </div>

        {loading ? (
          <p style={{ padding: "24px", color: "#64748b" }}>Loading inquiries...</p>
        ) : recentInquiries.length === 0 ? (
          <p style={{ padding: "24px", color: "#64748b" }}>No inquiries received yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Status</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {recentInquiries.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.name}</strong></td>
                  <td>
                    <a
                      href={`https://wa.me/91${item.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb" }}
                    >
                      {item.phone} 💬
                    </a>
                  </td>
                  <td>{item.eventType}</td>
                  <td>{item.eventDate ? new Date(item.eventDate).toLocaleDateString("en-IN") : "N/A"}</td>
                  <td>
                    <span className={`status-pill status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
