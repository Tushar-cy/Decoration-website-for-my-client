import React from "react";

export function ErrorState({
  title = "Something went wrong",
  message = "We were unable to load this content. Please check your connection and try again.",
  onRetry,
}) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--surface-alt, #faf7f2)",
        borderRadius: "16px",
        border: "1px solid var(--border, #ede8e1)",
        maxWidth: "540px",
        margin: "32px auto",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
      <h3 style={{ margin: "0 0 10px 0", color: "var(--dark, #1a221f)", fontSize: "1.3rem" }}>
        {title}
      </h3>
      <p style={{ color: "var(--text-light, #667085)", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "24px" }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-gold"
          style={{ minHeight: "44px", minWidth: "120px", fontWeight: "700" }}
        >
          🔄 Try Again
        </button>
      )}
    </div>
  );
}
