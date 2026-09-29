import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("[PWA] Service Worker registered:", r);
    },
    onRegisterError(error) {
      console.warn("[PWA] Service Worker registration failed:", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: "calc(20px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#172019",
        color: "#ffffff",
        padding: "14px 20px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        maxWidth: "92vw",
        width: "max-content",
        border: "1px solid #b88932",
      }}
    >
      <span style={{ fontSize: "1.3rem" }}>✨</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <strong style={{ fontSize: "0.9rem", color: "#f8f4ed" }}>
          {needRefresh ? "New Update Available!" : "Ready for Offline Use"}
        </strong>
        <span style={{ fontSize: "0.78rem", color: "#c5bba8" }}>
          {needRefresh
            ? "Reload to experience the latest features and faster performance."
            : "Decor Joy can now be browsed even without internet."}
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
        {needRefresh && (
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            style={{
              backgroundColor: "#b88932",
              color: "#ffffff",
              border: "none",
              borderRadius: "50px",
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "44px",
              minWidth: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Update
          </button>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss notification"
          style={{
            backgroundColor: "transparent",
            color: "#e5d6bd",
            border: "1px solid rgba(229, 214, 189, 0.4)",
            borderRadius: "50px",
            padding: "8px 14px",
            fontSize: "0.82rem",
            cursor: "pointer",
            minHeight: "44px",
            minWidth: "44px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default PwaUpdatePrompt;
