import React from "react";
import { Link } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";
import { useShop } from "../context/ShopContext";

function ServiceCard({ service }) {
  const {
    title,
    description,
    category,
    startingPrice,
    image,
    badge,
    isPopular,
    setupTime,
    bestFor,
    color,
    material,
    rating = 4.9,
    included = [],
  } = service;

  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useShop();
  const isWishlisted = isInWishlist(service._id);

  const displayIncluded =
    included && included.length > 0
      ? included.slice(0, 3)
      : [
          "Premium metallic & chrome latex balloons",
          "Damage-free removable wall mounting",
          "Professional styling & on-site setup included",
        ];

  const inquiryMessage = `Hello Decor Joy Gurgaon! I am interested in booking the "${title}" package (₹${startingPrice ? startingPrice.toLocaleString("en-IN") : "custom"}). Please share availability!`;

  return (
    <div className="service-card" tabIndex="0">
      {/* Badge Ribbon */}
      {(badge || isPopular) && (
        <span className="service-popular-badge">
          {badge || "★ Popular"}
        </span>
      )}

      {/* Image Showcase with Hover Quick View & Wishlist Heart */}
      <div className="service-image-box" onClick={() => setQuickViewProduct(service)} style={{ cursor: "pointer" }}>
        <img src={image} alt={`Decoration setup for ${title}`} loading="lazy" />
        <span className="service-category-tag">{category}</span>

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(service);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "14px",
            right: (badge || isPopular) ? "110px" : "14px",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(4px)",
            border: "none",
            borderRadius: "50%",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 4,
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isWishlisted ? "❤️" : "🤍"}
        </button>

        {/* Quick View Button Hover Badge */}
        <div
          className="service-card-quickview-hint"
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 20, 18, 0.85)",
            color: "#ffffff",
            padding: "5px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.76rem",
            fontWeight: 700,
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            opacity: 0.9,
          }}
        >
          <span>👁️ Quick View</span>
        </div>
      </div>

      <div className="service-content">
        {/* Title & Price Header */}
        <div className="service-header-row">
          <h3
            className="service-card-title"
            onClick={() => setQuickViewProduct(service)}
            style={{ cursor: "pointer" }}
          >
            {title}
          </h3>
          <div className="service-price-block">
            <span className="service-price-from">Starts at</span>
            <span className="service-price-value">
              ₹{startingPrice ? startingPrice.toLocaleString("en-IN") : "Custom"}
            </span>
          </div>
        </div>

        {/* Specs Strip */}
        <div className="service-specs-strip">
          <span className="service-spec-pill">⏱️ {setupTime || "60-90 Mins"}</span>
          {color && <span className="service-spec-pill">🎨 {color}</span>}
          {material && <span className="service-spec-pill">💎 {material}</span>}
          <span className="service-spec-pill" style={{ color: "#d97706", fontWeight: 700 }}>★ {rating}</span>
        </div>

        <p className="service-card-desc">{description}</p>

        {/* What's Included */}
        <div className="service-included-box">
          <div className="service-included-title">Package Includes:</div>
          <ul className="service-included-list">
            {displayIncluded.map((item, idx) => (
              <li key={idx} className="service-included-item">
                <span className="service-included-check">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer CTAs: Add to Bag + WhatsApp */}
        <div className="service-card-footer">
          <button
            type="button"
            className="btn btn-gold service-book-btn"
            onClick={() => addToCart(service)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <span>Book / Add to Bag</span>
            <span>🛍️</span>
          </button>

          <WhatsAppButton
            text="WhatsApp Quote"
            message={inquiryMessage}
            className="btn btn-whatsapp service-book-btn"
          />
        </div>
      </div>
    </div>
  );
}

export default ServiceCard;
