import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { DEFAULT_SERVICES } from "../services/api";
import WhatsAppButton from "./WhatsAppButton";

function ProductQuickViewModal() {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useShop();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ display: "none" });

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const activeImage = gallery[activeImageIndex] || product.image;
  const isWishlisted = isInWishlist(product._id);

  // Related products based on relatedIds or category
  const relatedProducts = DEFAULT_SERVICES.filter(
    (s) => s._id !== product._id && (product.relatedIds?.includes(s._id) || s.category === product.category)
  ).slice(0, 3);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${activeImage})`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => setQuickViewProduct(null)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 20, 18, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 2100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "960px",
          maxHeight: "92vh",
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          position: "relative",
          animation: "modalFadeIn 0.25s ease-out",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close product preview"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            cursor: "pointer",
            zIndex: 10,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          ✕
        </button>

        {/* Modal Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: "36px",
            padding: "36px",
          }}
        >
          {/* Left: Image Gallery & Zoom Showcase */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              className="quickview-image-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                position: "relative",
                aspectRatio: "4 / 3.2",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                backgroundColor: "var(--cream)",
                cursor: "crosshair",
              }}
            >
              <img
                src={activeImage}
                alt={product.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Zoom lens overlay container */}
              <div
                className="zoom-lens-overlay"
                style={{
                  ...zoomStyle,
                  position: "absolute",
                  inset: 0,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "220%",
                  pointerEvents: "none",
                  zIndex: 4,
                  borderRadius: "var(--radius-lg)",
                }}
              />

              <span
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  pointerEvents: "none",
                }}
              >
                🔍 Hover to Zoom
              </span>

              {/* Wishlist Heart Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "var(--white)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 5,
                }}
              >
                {isWishlisted ? "❤️" : "🤍"}
              </button>
            </div>

            {/* Thumbnail Gallery Row */}
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: "10px" }}>
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: activeImageIndex === i ? "2px solid var(--gold)" : "2px solid var(--border)",
                      padding: 0,
                      cursor: "pointer",
                      background: "none",
                      opacity: activeImageIndex === i ? 1 : 0.65,
                      transition: "var(--transition)",
                    }}
                  >
                    <img src={img} alt={`View ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Specifications */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="badge-gold">{product.category}</span>
              {product.badge && <span className="service-popular-badge" style={{ position: "static" }}>{product.badge}</span>}
            </div>

            <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--dark)", marginBottom: "8px", lineHeight: 1.25 }}>
              {product.title}
            </h2>

            {/* Rating & Reviews */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "0.85rem" }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>★ {product.rating || "4.9"}</span>
              <span style={{ color: "var(--text-light)" }}>({product.reviewCount || 120} verified Gurgaon setups)</span>
            </div>

            {/* Price block */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "18px" }}>
              <span style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--dark)" }}>
                ₹{product.startingPrice?.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--success)", fontWeight: 700 }}>
                • Free Gurgaon Delivery Included
              </span>
            </div>

            <p style={{ fontSize: "0.92rem", color: "var(--text-light)", lineHeight: 1.6, marginBottom: "20px" }}>
              {product.description}
            </p>

            {/* Specifications Matrix */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                background: "var(--surface-alt)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                marginBottom: "22px",
                fontSize: "0.82rem",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Color Palette</span>
                <strong style={{ color: "var(--dark)" }}>{product.color || "Rose Gold & Blush"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Primary Material</span>
                <strong style={{ color: "var(--dark)" }}>{product.material || "Metallic Latex & Neon"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Setup Time</span>
                <strong style={{ color: "var(--dark)" }}>{product.setupTime || "90 Minutes"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Dimensions</span>
                <strong style={{ color: "var(--dark)" }}>{product.dimensions || "6ft Arch Frame"}</strong>
              </div>
            </div>

            {/* Included Checklist */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--dark-gold)", marginBottom: "8px" }}>
                What's Included in Package:
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                {(product.included || []).map((item, idx) => (
                  <li key={idx} style={{ fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
                    <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => {
                  addToCart(product);
                  setQuickViewProduct(null);
                }}
                style={{ flex: 1 }}
              >
                Add to Celebration Bag 🛍️
              </button>
              <WhatsAppButton
                text="Inquire on WhatsApp"
                message={`Hi Decor Joy! I'm interested in the "${product.title}" setup (₹${product.startingPrice}). Can you check date availability?`}
                className="btn btn-whatsapp"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Related / Recommended Products */}
        {relatedProducts.length > 0 && (
          <div
            style={{
              padding: "28px 36px 36px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface-alt)",
            }}
          >
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--dark)" }}>
              You May Also Like for This Celebration
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
              {relatedProducts.map((rel) => (
                <div
                  key={rel._id}
                  onClick={() => {
                    setQuickViewProduct(rel);
                    setActiveImageIndex(0);
                  }}
                  style={{
                    background: "var(--white)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    transition: "var(--transition)",
                  }}
                >
                  <img
                    src={rel.image}
                    alt={rel.title}
                    style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {rel.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--dark-gold)", fontWeight: 800, marginTop: "2px" }}>
                      ₹{rel.startingPrice?.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductQuickViewModal;
