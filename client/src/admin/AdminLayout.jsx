import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getAdminProfile, logoutAdmin } from "../services/api";
import AdminErrorBoundary from "./components/AdminErrorBoundary";
import { UndoToastProvider } from "./context/UndoToastContext";
import { AdminRealtimeProvider, useAdminRealtime } from "./context/AdminRealtimeContext";
import AdminBottomNav from "./components/AdminBottomNav";
import "../styles/admin.css";

const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function AdminLayoutInner({ currentUser, onLogout }) {
  const isOwner = currentUser?.role === "owner";
  const { stats } = useAdminRealtime();

  return (
    <div className="admin-body">
      <div className="admin-layout">
        {/* Desktop Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-title">
              Decor Joy <span>Admin</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
              Gurgaon Event Operations
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
              to="/admin/orders"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>🛍️</span>
              <span style={{ display: "flex", justifyContent: "space-between", flex: 1, alignItems: "center" }}>
                <span>Orders</span>
                {(stats?.ordersNeedingAction || 0) > 0 && (
                  <span className="nav-badge-pill">{stats.ordersNeedingAction}</span>
                )}
              </span>
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>🎈</span>
              <span>Products & Setups</span>
            </NavLink>

            <NavLink
              to="/admin/categories"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>🏷️</span>
              <span>Categories & Add-Ons</span>
            </NavLink>

            <NavLink
              to="/admin/availability"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📅</span>
              <span>Slot Availability</span>
            </NavLink>

            <NavLink
              to="/admin/forms"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>🛠️</span>
              <span>Form Builder</span>
            </NavLink>

            <NavLink
              to="/admin/submissions"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📝</span>
              <span style={{ display: "flex", justifyContent: "space-between", flex: 1, alignItems: "center" }}>
                <span>Submissions Inbox</span>
                {(stats?.newSubmissionsCount || 0) > 0 && (
                  <span className="nav-badge-pill">{stats.newSubmissionsCount}</span>
                )}
              </span>
            </NavLink>

            <NavLink
              to="/admin/gallery"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📸</span>
              <span>Gallery</span>
            </NavLink>

            <NavLink
              to="/admin/testimonials"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>⭐</span>
              <span>Testimonials</span>
            </NavLink>

            {/* Owner-Only Navigation */}
            {isOwner && (
              <>
                <div style={{ height: "1px", background: "#1e293b", margin: "8px 0" }} />

                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </NavLink>

                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
                >
                  <span>👥</span>
                  <span>Staff Users</span>
                </NavLink>
              </>
            )}

            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
            >
              <span>📜</span>
              <span>Audit Logs</span>
            </NavLink>

            <Link to="/" target="_blank" className="admin-nav-item" style={{ marginTop: "16px" }}>
              <span>🌐</span>
              <span>Customer Site ↗</span>
            </Link>
          </nav>

          <div className="admin-sidebar-footer">
            <button className="admin-logout-btn" onClick={onLogout}>
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-title">Decor Joy Management</div>
            <div className="admin-user-info">
              <span>
                👤 {currentUser?.name || "Admin"} (
                <strong style={{ color: isOwner ? "#b88932" : "#2563eb" }}>
                  {currentUser?.role ? currentUser.role.toUpperCase() : "STAFF"}
                </strong>
                )
              </span>
            </div>
          </header>

          <div className="admin-content-body">
            <Outlet context={{ currentUser }} />
          </div>

          {/* Mobile Bottom Navigation under 768px */}
          <AdminBottomNav user={currentUser} onLogout={onLogout} />
        </main>
      </div>
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          fontSize: "1rem",
        }}
      >
        <span>Verifying secure admin session...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={adminQueryClient}>
      <AdminErrorBoundary>
        <UndoToastProvider>
          <AdminRealtimeProvider>
            <AdminLayoutInner currentUser={currentUser} onLogout={handleLogout} />
          </AdminRealtimeProvider>
        </UndoToastProvider>
      </AdminErrorBoundary>
    </QueryClientProvider>
  );
}

export default AdminLayout;
