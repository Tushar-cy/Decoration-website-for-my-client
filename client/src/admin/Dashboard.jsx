import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStats } from "../services/api";

function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const res = await getAdminDashboardStats();
      return res.data?.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Loading inquiry & lead metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px", background: "#fef2f2", borderRadius: "10px", color: "#dc2626" }}>
        Failed to load dashboard metrics.{" "}
        <button type="button" className="btn-admin-primary" onClick={() => refetch()} style={{ marginLeft: "12px" }}>
          Retry
        </button>
      </div>
    );
  }

  const {
    totalSubmissions = 0,
    newSubmissionsCount = 0,
    todaySubmissionsCount = 0,
    thisWeekSubmissionsCount = 0,
    statusBreakdown = {},
    occasionBreakdown = [],
    recentSubmissions = [],
  } = data || {};

  const getWhatsAppUrl = (sub) => {
    const rawPhone = sub.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hello ${sub.name}! Thank you for enquiring with Decor Joy Gurgaon regarding your ${sub.formKey || "event"} decoration. I'd love to assist you with package options and ideas!`
    );
    return `https://wa.me/91${cleanPhone}?text=${msg}`;
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Enquiries & Leads Dashboard</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Real-time tracking of decoration leads, WhatsApp follow-ups, and customer submissions.
          </p>
        </div>
        <button
          type="button"
          className="btn-action-edit"
          onClick={() => refetch()}
          style={{ background: "#ffffff", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <span>🔄</span> Refresh Stats
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#b88932" }}>
              {newSubmissionsCount}
            </div>
            <div className="admin-stat-label">New Enquiries (Pending Contact)</div>
          </div>
          <div className="admin-stat-icon">🔔</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#2563eb" }}>
              {todaySubmissionsCount}
            </div>
            <div className="admin-stat-label">Today's Enquiries</div>
          </div>
          <div className="admin-stat-icon">📅</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#16a34a" }}>
              {thisWeekSubmissionsCount}
            </div>
            <div className="admin-stat-label">This Week's Enquiries</div>
          </div>
          <div className="admin-stat-icon">📈</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#0f172a" }}>
              {totalSubmissions}
            </div>
            <div className="admin-stat-label">Total Submissions (All Time)</div>
          </div>
          <div className="admin-stat-icon">📋</div>
        </div>
      </div>

      {/* Two-Column Section: Occasion Breakdown + Pipeline Status */}
      <div className="fb-layout" style={{ marginBottom: "24px" }}>
        {/* Left: Occasion Breakdown */}
        <div className="fb-card">
          <div className="fb-card-title">
            <span>🎉 Form Submissions by Occasion</span>
            <Link to="/admin/submissions" style={{ fontSize: "0.82rem", color: "#b88932", textDecoration: "none" }}>
              All Leads ➔
            </Link>
          </div>

          {occasionBreakdown.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.9rem", padding: "20px 0" }}>
              No submissions recorded yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {occasionBreakdown.map((item) => {
                const percent = totalSubmissions > 0 ? Math.round((item.count / totalSubmissions) * 100) : 0;
                return (
                  <div key={item._id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "120px", fontSize: "0.82rem", fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>
                      {item._id || "General"}
                    </span>
                    <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background: "#b88932",
                          borderRadius: "5px",
                        }}
                      />
                    </div>
                    <span style={{ width: "65px", fontSize: "0.78rem", textAlign: "right", color: "#64748b", fontWeight: 600 }}>
                      {item.count} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Pipeline Status */}
        <div className="fb-card">
          <div className="fb-card-title">
            <span>📊 Lead Pipeline Status</span>
            <Link to="/admin/submissions" style={{ fontSize: "0.82rem", color: "#b88932", textDecoration: "none" }}>
              Manage Leads ➔
            </Link>
          </div>

          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "16px" }}>
            Current stage of customer conversations and bookings.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {[
              { key: "new", label: "New", color: "#eab308", bg: "#fef9c3" },
              { key: "contacted", label: "Contacted", color: "#3b82f6", bg: "#eff6ff" },
              { key: "quoted", label: "Quoted", color: "#8b5cf6", bg: "#f5f3ff" },
              { key: "converted", label: "Converted", color: "#16a34a", bg: "#f0fdf4" },
              { key: "closed", label: "Closed", color: "#64748b", bg: "#f8fafc" },
              { key: "spam", label: "Spam", color: "#ef4444", bg: "#fef2f2" },
            ].map((st) => (
              <div
                key={st.key}
                style={{
                  background: st.bg,
                  border: `1px solid ${st.color}30`,
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: st.color }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                    {statusBreakdown[st.key] || 0}
                  </div>
                </div>
                <div style={{ fontSize: "1.2rem" }}>
                  {st.key === "converted" ? "🏆" : st.key === "new" ? "🔔" : st.key === "quoted" ? "💬" : "📁"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Enquiries Requiring Attention */}
      <div className="fb-card">
        <div className="fb-card-title">
          <span>⚡ Recent Submissions Requiring Attention</span>
          <Link to="/admin/submissions" style={{ fontSize: "0.82rem", color: "#b88932", textDecoration: "none" }}>
            View All Submissions ➔
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.9rem", padding: "20px 0" }}>No recent submissions.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentSubmissions.map((sub) => (
              <div
                key={sub._id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{sub.name}</strong>
                    <span className="badge-gold" style={{ textTransform: "capitalize" }}>{sub.formKey || "Inquiry"}</span>
                    <span className={`status-pill status-${sub.status}`}>{sub.status}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "4px" }}>
                    📞 {sub.phone} {sub.email ? `• ✉️ ${sub.email}` : ""}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                    Received: {new Date(sub.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <a
                    href={getWhatsAppUrl(sub)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-admin-primary"
                    style={{
                      background: "#25d366",
                      fontSize: "0.82rem",
                      padding: "6px 14px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>💬</span> WhatsApp Follow-up
                  </a>
                  <Link
                    to={`/admin/submissions`}
                    className="btn-action-edit"
                    style={{ fontSize: "0.82rem", padding: "6px 12px", textDecoration: "none" }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
