import React from "react";

function TestimonialCard({ testimonial }) {
  const { name, location, eventType, review, rating = 5 } = testimonial;

  // Helper to render star icons
  const renderStars = (count) => {
    return "★".repeat(Math.max(1, Math.min(5, count)));
  };

  return (
    <div className="why-card" style={{ textAlign: "left" }}>
      <div style={{ color: "var(--gold)", fontSize: "1.25rem", marginBottom: "12px", letterSpacing: "2px" }}>
        {renderStars(rating)}
      </div>
      <p style={{ color: "var(--text)", fontStyle: "italic", fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "20px" }}>
        "{review}"
      </p>
      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
        <h4 style={{ fontSize: "1.05rem", color: "var(--dark)", marginBottom: "2px" }}>{name}</h4>
        <span style={{ fontSize: "0.82rem", color: "var(--text-light)" }}>
          {eventType} • {location || "Gurgaon"}
        </span>
      </div>
    </div>
  );
}

export default TestimonialCard;
