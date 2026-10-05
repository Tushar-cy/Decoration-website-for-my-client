import React from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import WhatsAppButton from "./WhatsAppButton";
import { useShop } from "../context/ShopContext";
import { getOptimizedImageUrl, getImageSrcSet } from "../utils/cloudinary";
import { formatPaise } from "../utils/money";
import { usePrefetchHandlers } from "../utils/prefetch";

function ServiceCard({ service }) {
  const queryClient = useQueryClient();
  const {
    _id,
    title,
    description,
    shortDescription,
    category,
    categoryId,
    startingPrice,
    basePricePaise,
    image,
    images,
    badge,
    isPopular,
    setupTime,
    color,
    material,
    rating = 4.9,
    ratingAvg,
    ratingCount,
    slug,
  } = service;

  const prefetchProps = usePrefetchHandlers(slug, queryClient);

  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const isWishlisted = isInWishlist(_id);

  // Determine display price and image
  const priceDisplay = basePricePaise
    ? formatPaise(basePricePaise)
    : startingPrice
    ? `₹${startingPrice.toLocaleString("en-IN")}`
    : "Custom";

  const rawImage = (images && images[0]?.url) || image || "/decor-gallery/decor_001.jpg";
  const optimizedImage = getOptimizedImageUrl(rawImage, { width: 500, height: 350, crop: "fill" });
  const categoryName = categoryId?.name || category || "Event Decor";
  const displayRating = ratingAvg || rating;

  const targetLink = slug ? `/p/${slug}` : `/shop`;

  return (
    <div className="service-card" tabIndex="0" {...prefetchProps}>
      {/* Badge Ribbon */}
      {(badge || isPopular) && (
        <span className="service-popular-badge">
          {badge || "★ Popular"}
        </span>
      )}

      {/* Image Showcase */}
      <div className="service-image-box">
        <Link to={targetLink} {...prefetchProps}>
          <img
            src={optimizedImage}
            srcSet={getImageSrcSet(rawImage, [320, 480, 600])}
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
            alt={`Decoration setup for ${title}`}
            loading="lazy"
            width="500"
            height="350"
          />
        </Link>
        <span className="service-category-tag">{categoryName}</span>

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
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 4,
          }}
        >
          {isWishlisted ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="service-content">
        <div className="service-header-row">
          <h3 className="service-card-title">
            <Link to={targetLink}>{title}</Link>
          </h3>
          <div className="service-price-block">
            <span className="service-quote-badge">✓ Custom Quote on WhatsApp</span>
          </div>
        </div>

        {/* Specs Strip */}
        <div className="service-specs-strip">
          <span className="service-spec-pill">⏱️ {setupTime || "90 Mins"}</span>
          {color && <span className="service-spec-pill">🎨 {color}</span>}
          {material && <span className="service-spec-pill">💎 {material}</span>}
          <span className="service-spec-pill" style={{ color: "#d97706", fontWeight: 700 }}>
            ★ {displayRating} {ratingCount ? `(${ratingCount})` : ""}
          </span>
        </div>

        <p className="service-card-desc">{shortDescription || description}</p>

        {/* Footer CTAs: View / Book Setup */}
        <div className="service-card-footer">
          <Link
            to={targetLink}
            className="btn btn-gold service-book-btn"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <span>View Setup</span>
            <span>➔</span>
          </Link>

          <WhatsAppButton
            text="WhatsApp Quote"
            message={`Hello Decor Joy Gurgaon! I am interested in the "${title}" decoration setup. Please share availability and details!`}
            className="btn btn-whatsapp service-book-btn"
          />
        </div>
      </div>
    </div>
  );
}

export default ServiceCard;
