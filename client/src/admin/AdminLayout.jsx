import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { getAdminProfile, logoutAdmin } from "../services/api";
import "../styles/admin.css";

function AdminLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session by calling /auth/me
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const res = await getAdminProfile();
        if (isMounted) {
          setCurrentUser(res.data);
          setLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          navigate("/admin/login");
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/admin/login");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          color: "#475569",
          fontFamily: "inherit",
          fontSize: "1rem",
        }}
      >
        <span>Verifying secure session...</span>
      </div>
    );
  }

  return (
    <div className="admin-body">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-title">
              Decor Joy <span>Admin</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Gurgaon Control Panel
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/services"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>🎈</span>
              <span>Services</span>
            </NavLink>

            <NavLink
              to="/admin/gallery"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📸</span>
              <span>Gallery</span>
            </NavLink>

            <NavLink
              to="/admin/inquiries"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📩</span>
              <span>Inquiries</span>
            </NavLink>

            <NavLink
              to="/admin/testimonials"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>⭐</span>
              <span>Testimonials</span>
            </NavLink>

            <Link to="/" target="_blank" className="admin-nav-item" style={{ marginTop: "20px" }}>
              <span>🌐</span>
              <span>View Customer Site ↗</span>
            </Link>
          </nav>

          <div className="admin-sidebar-footer">
            <button className="admin-logout-btn" onClick={handleLogout}>
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content View */}
        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-title">Decor Joy Management</div>
            <div className="admin-user-info">
              <span>👤 {currentUser?.name || "Admin"} ({currentUser?.role ? currentUser.role.toUpperCase() : "STAFF"})</span>
            </div>
          </header>

          <div className="admin-content-body">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
