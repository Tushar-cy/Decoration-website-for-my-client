import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const UndoToastContext = createContext(null);

export function UndoToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showUndoToast = ({ message, onUndo, duration = 8000 }) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      message,
      onUndo,
      duration,
      startTime: Date.now(),
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const handleUndo = () => {
    if (toast && typeof toast.onUndo === "function") {
      toast.onUndo();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(null);
  };

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(null);
  };

  return (
    <UndoToastContext.Provider value={{ showUndoToast }}>
      {children}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#0f172a",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            maxWidth: "420px",
            animation: "slideInUp 0.25s ease-out",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>🗑️</span>
          <span style={{ fontSize: "0.88rem", flex: 1 }}>{toast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            style={{
              background: "#b88932",
              color: "#ffffff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            ↩ UNDO (8s)
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "2px",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </UndoToastContext.Provider>
  );
}

export function useUndoToast() {
  const context = useContext(UndoToastContext);
  if (!context) {
    throw new Error("useUndoToast must be used within an UndoToastProvider");
  }
  return context;
}
