import React from "react";
import { usePublicSettings } from "../context/SettingsContext";

// Reusable WhatsApp Button Component
function WhatsAppButton({
  text = "Chat on WhatsApp",
  message = "Hello Decor Joy Gurgaon, I would like to inquire about event decorations!",
  className = "btn btn-whatsapp",
  isFloating = false,
}) {
  const { cleanWhatsapp } = usePublicSettings();
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodedMessage}`;

  if (isFloating) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-floating"
        title="Chat with Decor Joy Gurgaon on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        💬
      </a>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <span role="img" aria-label="whatsapp">💬</span>
      <span>{text}</span>
    </a>
  );
}

export default WhatsAppButton;
