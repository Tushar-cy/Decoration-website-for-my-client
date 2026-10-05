import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAdminRealtime } from "../context/AdminRealtimeContext";

function AdminBottomNav({ user, onLogout }) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { stats } = useAdminRealtime();
  const isOwner = user?.role === "owner";

  const closeMore = () => setMoreMenuOpen(false);

  return (
    <>
      {/* Slide-over sheet for "More" menu on mobile */}
      {moreMenuOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={closeMore}
          style={{ zIndex: 3000, alignItems: "flex-end", padding: 0 }}
        >
          <div
            style={{
              width: "100%",
              background: "#ffffff",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              padding: "24px 20px 40px",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.15)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>More Admin Tools</h3>
              <button
                type="button"
                onClick={closeMore}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <NavLink
                to="/admin/forms"
                onClick={closeMore}
                className="admin-nav-item"
                style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
              >
                <span>🛠️</span>
                <span>Form Builder</span>
              </NavLink>

              <NavLink
                to="/admin/categories"
                onClick={closeMore}
                className="admin-nav-item"
                style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
              >
                <span>🏷️</span>
                <span>Categories</span>
              </NavLink>

              <NavLink
                to="/admin/gallery"
                onClick={closeMore}
                className="admin-nav-item"
                style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
              >
                <span>📸</span>
                <span>Gallery</span>
              </NavLink>

              <NavLink
                to="/admin/testimonials"
                onClick={closeMore}
                className="admin-nav-item"
                style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
              >
                <span>⭐</span>
                <span>Reviews</span>
              </NavLink>

              {isOwner && (
                <>
                  <NavLink
                    to="/admin/settings"
                    onClick={closeMore}
                    className="admin-nav-item"
                    style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </NavLink>

                  <NavLink
                    to="/admin/users"
                    onClick={closeMore}
                    className="admin-nav-item"
                    style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
                  >
                    <span>👥</span>
                    <span>Staff Users</span>
                  </NavLink>
                </>
              )}

              <NavLink
                to="/admin/audit-logs"
                onClick={closeMore}
                className="admin-nav-item"
                style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}
              >
                <span>📜</span>
                <span>Audit Logs</span>
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  closeMore();
                  onLogout();
                }}
                className="admin-nav-item"
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  cursor: "pointer",
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Bar */}
      <nav className="admin-bottom-nav" aria-label="Mobile Admin Navigation">
        <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>📊</span>
          <span>Home</span>
        </NavLink>

        <NavLink to="/admin/products" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>🎈</span>
          <span>Catalog</span>
        </NavLink>

        <NavLink to="/admin/gallery" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>📸</span>
          <span>Gallery</span>
        </NavLink>

        <NavLink to="/admin/submissions" className={({ isActive }) => (isActive ? "active" : "")}>
          <span style={{ position: "relative" }}>
            📝
            {(stats?.newSubmissionsCount || 0) > 0 && (
              <span className="nav-badge-pill">{stats.newSubmissionsCount}</span>
            )}
          </span>
          <span>Inbox</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMoreMenuOpen(true)}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            color: "#64748b",
            fontSize: "0.75rem",
            cursor: "pointer",
            minHeight: "44px",
            minWidth: "44px",
            justifyContent: "center",
          }}
        >
          <span>☰</span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default AdminBottomNav;
