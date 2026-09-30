import React, { useState, useEffect } from "react";
import { isDoNotTrack, setConsent } from "../utils/analytics";
import "./CookieConsentBanner.css";

const CONSENT_KEY = "decorjoy_cookie_consent";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If Do Not Track is enabled, never display tracking banner
    if (isDoNotTrack()) return;

    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Small delay so it doesn't obstruct initial page render
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    setConsent("accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    setConsent("declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="cookie-consent-bar"
      role="region"
      aria-label="Cookie consent banner"
    >
      <div className="cookie-consent-content">
        <p className="cookie-consent-text">
          ✨ <strong>We respect your privacy:</strong> We use cookies to enhance
          your browsing experience and analyze celebration trends. We respect
          Do Not Track preferences.
        </p>
        <div className="cookie-consent-actions">
          <button
            type="button"
            className="cookie-btn cookie-btn-accept"
            onClick={handleAccept}
          >
            Accept All
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-decline"
            onClick={handleDecline}
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
