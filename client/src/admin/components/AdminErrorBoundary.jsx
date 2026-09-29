import React from "react";

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px 20px",
            maxWidth: "600px",
            margin: "60px auto",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            Something went wrong in the Admin Panel
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "20px" }}>
            {this.state.error?.message || "An unexpected error occurred while rendering this view."}
          </p>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={this.handleReset}
            style={{ padding: "10px 24px" }}
          >
            🔄 Reload Admin Portal
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
