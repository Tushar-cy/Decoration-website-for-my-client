import React from "react";
import { useShop } from "../context/ShopContext";

function Toast() {
  const { toast } = useShop();

  if (!toast) return null;

  const icon = toast.type === "info" ? "ℹ️" : toast.type === "error" ? "⚠️" : "✨";

  return (
    <div
      role="status"
      aria-live="polite"
      className="global-toast"
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--dark)",
        color: "var(--white)",
        padding: "12px 24px",
        borderRadius: "var(--radius-full)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "0.92rem",
        fontWeight: "600",
        animation: "toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        pointerEvents: "none",
      }}
    >
      <span>{icon}</span>
      <span>{toast.message}</span>
    </div>
  );
}

export default Toast;
