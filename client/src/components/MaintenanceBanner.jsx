/**
 * MaintenanceBanner
 * Shows a site-wide top bar when Settings.flags.maintenanceBanner is non-empty.
 * Also shows a "bookings paused" banner when bookingsPaused=true.
 * Rendered at the top of App.jsx, above Navbar.
 */
import React, { useState } from "react";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import "./MaintenanceBanner.css";

export default function MaintenanceBanner() {
  const { maintenanceBanner, bookingsPaused, onlinePayments } = useFeatureFlags();
  const [dismissed, setDismissed] = useState(false);

  // Priority: maintenance > bookings paused > payment mode
  const message = maintenanceBanner ||
    (bookingsPaused
      ? "🛑 Bookings are temporarily paused. Please WhatsApp us to enquire."
      : null) ||
    (!onlinePayments
      ? "⚠️ Online payment is temporarily unavailable. We'll confirm your booking via call within 2 hours."
      : null);

  if (!message || dismissed) return null;

  return (
    <div
      className={`maintenance-banner ${maintenanceBanner ? "banner-maintenance" : bookingsPaused ? "banner-paused" : "banner-payment"}`}
      role="alert"
      aria-live="polite"
    >
      <span className="banner-text">{message}</span>
      <button
        className="banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
