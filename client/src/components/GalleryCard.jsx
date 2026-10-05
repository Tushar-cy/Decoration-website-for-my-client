import React, { useState } from "react";
import { usePublicSettings } from "../context/SettingsContext";

function GalleryCard({ item, onSelect, index = 0 }) {
  const { cleanWhatsapp } = usePublicSettings();
  const {
    title,
    category,
    description,
    psychologyHeadline,
    badge,
    locality,
    features = [],
    qualityTier,
    isFeatured,
    thumbUrl,
    src,
    image,
  } = item;

  // Use local self-hosted image for 100% reliability on VPS, fallback to remote if needed
  const initialImg = src || image || thumbUrl;
  const [imgSource, setImgSource] = useState(initialImg);

  const handleImageError = () => {
    if (thumbUrl && imgSource !== thumbUrl) {
      setImgSource(thumbUrl);
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://decorjoy.com";
  const inquiryMessage = encodeURIComponent(
    `Hello Decor Joy Gurgaon! I loved this design from your gallery:\n\n✨ *${title}*\n📍 *Category:* ${category}\n📸 *Photo:* ${baseUrl}${src || image}\n\nCould you please check availability and details for my date in Gurgaon?`
  );
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${inquiryMessage}`;

  return (
    <div
      className={`gallery-item ${isFeatured ? "gallery-item-featured" : ""}`}
      onClick={() => onSelect && onSelect(item)}
      role="button"
      tabIndex={0}
      aria-label={`View ${title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSelect) onSelect(item);
      }}
    >
      <div className="gallery-image-wrapper">
        <img
          className="gallery-image"
          src={imgSource}
          alt={title}
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          onError={handleImageError}
          width="480"
          height="600"
        />

        {/* Quality & Status Badges */}
        <div className="gallery-badges-top">
          {badge && (
            <span className={`gallery-badge ${isFeatured ? "badge-featured" : "badge-standard"}`}>
              {badge}
            </span>
          )}
          {qualityTier && qualityTier.includes("Ultra HD") && (
            <span className="gallery-badge badge-uhd" title="Ultra HD Real Setup">
              💎 Ultra HD
            </span>
          )}
        </div>

        {/* Locality Tag */}
        {locality && (
          <div className="gallery-locality-tag">
            <span className="locality-pin">📍</span> {locality.split(",")[0]}
          </div>
        )}
      </div>

      <div className="gallery-card-content">
        <div className="gallery-card-header">
          <span className="gallery-category-pill">{category}</span>
          <span className="gallery-verified-pill">✓ Verified Real Setup</span>
        </div>

        <h4 className="gallery-title">{title}</h4>

        {psychologyHeadline ? (
          <p className="gallery-psychology-desc">{psychologyHeadline}</p>
        ) : description ? (
          <p className="gallery-psychology-desc">{description}</p>
        ) : null}

        {features.length > 0 && (
          <div className="gallery-feature-tags">
            {features.slice(0, 3).map((feat, i) => (
              <span key={i} className="gallery-feature-tag">
                ✓ {feat}
              </span>
            ))}
          </div>
        )}

        <div className="gallery-card-actions">
          <button
            type="button"
            className="gallery-btn-view"
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(item);
            }}
          >
            <span>🔍 Details & Zoom</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gallery-btn-whatsapp"
            onClick={(e) => e.stopPropagation()}
            title="Inquire directly on WhatsApp for this setup"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default GalleryCard;
