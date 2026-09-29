import React from "react";
import { Link } from "react-router-dom";

function RoleGuard({ user, requiredRole = "owner", children }) {
  if (!user) {
    return null;
  }

  if (requiredRole === "owner" && user.role !== "owner") {
    return (
      <div
        style={{
          padding: "48px 24px",
          maxWidth: "540px",
          margin: "40px auto",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #fee2e2",
          boxShadow: "0 10px 25px rgba(239, 68, 68, 0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#991b1b", marginBottom: "8px" }}>
          403 - Restricted to Store Owner
        </h2>
        <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
          Your current account role (<strong>{user.role?.toUpperCase()}</strong>) does not have permission to view or modify this area. Please contact the store owner.
        </p>
        <Link to="/admin/dashboard" className="btn-admin-primary" style={{ textDecoration: "none" }}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return children;
}

export default RoleGuard;
