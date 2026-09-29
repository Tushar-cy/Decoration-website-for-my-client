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
        Loading dashboard metrics...
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
    todaySetups = [],
    ordersNeedingAction = 0,
    unpaidAdvances = 0,
    newSubmissionsCount = 0,
    revenueThisWeekPaise = 0,
    revenueThisMonthPaise = 0,
    slotLoad = [],
    recentSubmissions = [],
  } = data || {};

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Gurgaon Operations Overview</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Real-time status of orders, setup crew allocations, and leads.
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
            <div className="admin-stat-number" style={{ color: "#2563eb" }}>
              {ordersNeedingAction}
            </div>
            <div className="admin-stat-label">Orders Needing Action</div>
          </div>
          <div className="admin-stat-icon">🛍️</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#dc2626" }}>
              {unpaidAdvances}
            </div>
            <div className="admin-stat-label">Unpaid Advances</div>
          </div>
          <div className="admin-stat-icon">💳</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#b88932" }}>
              {newSubmissionsCount}
            </div>
            <div className="admin-stat-label">New Purpose Inquiries</div>
          </div>
          <div className="admin-stat-icon">📝</div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-number" style={{ color: "#16a34a" }}>
              ₹{(revenueThisMonthPaise / 100).toLocaleString("en-IN")}
            </div>
            <div className="admin-stat-label">30-Day Revenue (Paid)</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
              ₹{(revenueThisWeekPaise / 100).toLocaleString("en-IN")} this week
            </div>
          </div>
          <div className="admin-stat-icon">💰</div>
        </div>
      </div>

      {/* Two-Column Section: Today's Setups + 14-Day Slot Load */}
      <div className="fb-layout" style={{ marginBottom: "24px" }}>
        {/* Left: Today's Scheduled Setups */}
        <div className="fb-card">
          <div className="fb-card-title">
            <span>🚚 Today's Scheduled Setups ({todaySetups.length})</span>
            <Link to="/admin/orders" style={{ fontSize: "0.82rem", color: "#b88932", textDecoration: "none" }}>
              All Orders ➔
            </Link>
          </div>

          {todaySetups.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.9rem", padding: "20px 0" }}>
              No setups scheduled for today.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {todaySetups.map((ord) => (
                <div
                  key={ord._id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "14px",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                        {ord.customer?.name}
                      </strong>
                      <span className="badge-gold">#{ord.orderNumber}</span>
                      <span className={`status-pill status-${ord.status}`}>{ord.status}</span>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "4px" }}>
                      ⏰ <strong>{ord.slotKey?.toUpperCase()}</strong> • 📞 {ord.customer?.phone}
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                      📍 {ord.customer?.address || "Gurugram Address"} (PIN: {ord.customer?.pincode})
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                      ₹{((ord.totalPaise || 0) / 100).toLocaleString("en-IN")}
                    </div>
                    <a
                      href={`https://wa.me/91${(ord.customer?.phone || "").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action-edit"
                      style={{ marginTop: "6px", display: "inline-block", fontSize: "0.78rem" }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Next 14-Days Slot Load Chart */}
        <div className="fb-card">
          <div className="fb-card-title">
            <span>📅 Next 14 Days Slot Load</span>
            <Link to="/admin/availability" style={{ fontSize: "0.82rem", color: "#b88932", textDecoration: "none" }}>
              Calendar ➔
            </Link>
          </div>

          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "16px" }}>
            Real-time booking capacity across all morning, afternoon, evening, and midnight slots.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {slotLoad.map((slot) => {
              const barColor = slot.isBlackout
                ? "#dc2626"
                : slot.loadPercent > 80
                ? "#ea580c"
                : slot.loadPercent > 40
                ? "#b88932"
                : "#16a34a";

              return (
                <div key={slot.date} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "85px", fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>
                    {slot.date.slice(5)} ({new Date(slot.date).toLocaleDateString("en-IN", { weekday: "short" })})
                  </span>

                  <div
                    style={{
                      flex: 1,
                      height: "12px",
                      background: "#e2e8f0",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${slot.isBlackout ? 100 : slot.loadPercent}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: "6px",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>

                  <span style={{ width: "70px", fontSize: "0.75rem", textAlign: "right", color: "#64748b" }}>
                    {slot.isBlackout ? "BLOCKED" : `${slot.booked}/${slot.capacity}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Inquiries List */}
      <div className="fb-card">
        <div className="fb-card-title">
          <span>⚡ Recent Submissions Requiring Attention</span>
          <Link to="/admin/submissions" style={{ fontSize: "0.82rem", color: "#b88932", textDecoration: "none" }}>
            View Inbox ➔
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No recent submissions.</p>
        ) : (
          <div className="sub-answers-grid">
            {recentSubmissions.map((sub) => (
              <div key={sub._id} className="sub-answer-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{sub.name}</strong>
                  <span className={`status-pill status-${sub.status}`}>{sub.status}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                  📞 {sub.phone} • Purpose: <strong style={{ textTransform: "capitalize" }}>{sub.formKey}</strong>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                  {new Date(sub.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
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
