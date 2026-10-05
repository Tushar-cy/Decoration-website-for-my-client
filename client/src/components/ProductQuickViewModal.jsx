import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import WhatsAppButton from "./WhatsAppButton";
import { formatPaise } from "../utils/money";
import { getOptimizedImageUrl } from "../utils/cloudinary";

function ProductQuickViewModal() {
  const {
    quickViewProduct,
    setQuickViewProduct,
    toggleWishlist,
    isInWishlist,
  } = useShop();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const rawImages = (product.images && product.images.length > 0)
    ? product.images.map((im) => im.url || im)
    : (product.gallery && product.gallery.length > 0)
    ? product.gallery
    : [product.image || "/decor-gallery/decor_001.jpg"];

  const activeImage = rawImages[activeImageIndex] || rawImages[0];
  const isWishlisted = isInWishlist(product._id);
  const displayPrice = product.basePricePaise
    ? formatPaise(product.basePricePaise)
    : product.startingPrice
    ? `₹${product.startingPrice.toLocaleString("en-IN")}`
    : "Custom";

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
          maxWidth: "840px",
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
            gridTemplateColumns: "1fr",
            gap: "24px",
            padding: "28px",
          }}
        >
          {/* Left: Image Showcase */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "4 / 3",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                backgroundColor: "var(--cream)",
              }}
            >
              <img
                src={getOptimizedImageUrl(activeImage, { width: 700, height: 520, crop: "fill" })}
                alt={product.title}
                loading="lazy"
                width="700"
                height="520"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

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
            {rawImages.length > 1 && (
              <div style={{ display: "flex", gap: "10px", overflowX: "auto" }}>
                {rawImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    style={{
                      width: "68px",
                      height: "52px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: activeImageIndex === i ? "2px solid var(--gold)" : "1px solid var(--border)",
                      padding: 0,
                      cursor: "pointer",
                      background: "none",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={getOptimizedImageUrl(img, { width: 120, height: 90, crop: "fill" })}
                      alt={`View ${i + 1}`}
                      loading="lazy"
                      width="68"
                      height="52"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge-gold">
                {product.categoryId?.name || product.category || "Celebration"}
              </span>
              {product.badge && <span className="service-popular-badge" style={{ position: "static" }}>{product.badge}</span>}
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dark)", margin: "0", lineHeight: 1.3 }}>
              {product.title}
            </h2>

            {/* Price block */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gold, #d4af37)" }}>
                ✓ Custom Quote on WhatsApp
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--success)", fontWeight: 700 }}>
                • Free Gurgaon Setup & Takedown
              </span>
            </div>

            <p style={{ fontSize: "0.92rem", color: "var(--text-light)", lineHeight: 1.5, margin: "0" }}>
              {product.shortDescription || product.description}
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <Link
                to={product.slug ? `/p/${product.slug}` : "/shop"}
                className="btn btn-gold"
                onClick={() => setQuickViewProduct(null)}
                style={{ flex: 1, minHeight: "44px", textAlign: "center", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                View Package Details ➔
              </Link>

              <WhatsAppButton
                text="Inquire on WhatsApp"
                message={`Hi Decor Joy! I am interested in the "${product.title}" decoration package. Could you please share the custom quote and check availability?`}
                className="btn btn-whatsapp"
                style={{ flex: 1, minHeight: "44px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductQuickViewModal;
