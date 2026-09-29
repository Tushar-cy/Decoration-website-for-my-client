import React, { useState, useEffect } from "react";

function AdminPushNotificationPrompt() {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    if (!isSupported) return;
    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        // Show test greeting notification
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "PUSH_TEST_NOTIFICATION",
            title: "Decor Joy Admin Push Active",
            body: "You will now receive instant alerts for new event bookings & purpose form leads.",
          });
        } else {
          new Notification("Decor Joy Admin Alerts Active", {
            body: "You will receive instant alerts for new bookings & leads.",
            icon: "/admin-192x192.png",
          });
        }
      }
    } catch (err) {
      console.error("[Admin Push] Error requesting permission:", err);
    } finally {
      setSubscribing(false);
    }
  };

  if (!isSupported || permission === "granted" || permission === "denied" || dismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Admin Push Notification Prompt"
      style={{
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "12px",
        padding: "12px 16px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        color: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.2rem" }}>🔔</span>
        <div>
          <strong style={{ fontSize: "0.88rem", display: "block" }}>
            Enable Web Push Alerts for Orders & Leads
          </strong>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            Get instant mobile device notifications when a customer places an order or submits an enquiry.
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={enableNotifications}
          disabled={subscribing}
          style={{
            backgroundColor: "#b88932",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 14px",
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
          {subscribing ? "Enabling..." : "Enable Push"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss push prompt"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "1rem",
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
    </div>
  );
}

export default AdminPushNotificationPrompt;
