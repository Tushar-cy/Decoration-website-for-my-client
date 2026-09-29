import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginAdmin, getAdminProfile } from "../services/api";
import "../styles/admin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already authenticated with a valid session, redirect to dashboard
  useEffect(() => {
    let isMounted = true;
    getAdminProfile()
      .then(() => {
        if (isMounted) {
          navigate("/admin/dashboard");
        }
      })
      .catch(() => {
        // Not authenticated, remain on login page
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await loginAdmin({ email, password });
      // Authentication tokens are delivered as secure httpOnly cookies
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            Decor Joy <span>Gurgaon</span>
          </div>
          <span className="admin-login-badge">Management Portal</span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "0.88rem",
              marginBottom: "20px",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="admin@decorjoy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-admin-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In to Admin Panel 🔒"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>
          Authorized Personnel Only
          <div style={{ marginTop: "14px" }}>
            <Link to="/" style={{ color: "#b88932", textDecoration: "underline" }}>
              ← Return to Customer Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
