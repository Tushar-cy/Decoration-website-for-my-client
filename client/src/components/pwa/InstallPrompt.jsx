import React, { useState, useEffect } from "react";

const VISIT_COUNT_KEY = "decorjoy_visit_count";
const INSTALL_DISMISSED_KEY = "decorjoy_install_dismissed_session";

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Increment visit count once per browser session
    try {
      const sessionCounted = sessionStorage.getItem("decorjoy_session_counted");
      if (!sessionCounted) {
        const rawCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
        const newCount = isNaN(rawCount) ? 1 : rawCount + 1;
        localStorage.setItem(VISIT_COUNT_KEY, newCount.toString());
        sessionStorage.setItem("decorjoy_session_counted", "true");
      }
    } catch {
      // Storage access might fail in private/incognito mode
    }

    // 2. Check if running already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // 3. Listen for the native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check visit count requirement (shown after 2nd visit: visitCount >= 2)
      try {
        const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "1", 10);
        const dismissed = sessionStorage.getItem(INSTALL_DISMISSED_KEY);
        if (count >= 2 && !dismissed) {
          setIsVisible(true);
        }
      } catch {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsVisible(false);
      }
    } catch (err) {
      console.error("[PWA] Error triggering install prompt:", err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    } catch {}
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Install App Banner"
      style={{
        position: "fixed",
        top: "calc(12px + env(safe-area-inset-top))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "460px",
        backgroundColor: "#172019",
        color: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.35)",
        zIndex: 9998,
        padding: "14px 18px",
        border: "1px solid #b88932",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: "#b88932",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(184,137,50,0.3)",
          }}
        >
          ✨
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#f8f4ed" }}>
            Install Decor Joy App
          </div>
          <div style={{ fontSize: "0.78rem", color: "#c5bba8", marginTop: "1px" }}>
            Instant bookings, tracking & 1-tap WhatsApp support
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            backgroundColor: "#b88932",
            color: "#ffffff",
            border: "none",
            borderRadius: "50px",
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            minHeight: "44px",
            minWidth: "44px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
          }}
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss app install banner"
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: "1.2rem",
            cursor: "pointer",
            minHeight: "44px",
            minWidth: "44px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </aside>
  );
}

export default InstallPrompt;
