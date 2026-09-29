import React from "react";
import { getOptimizedImageUrl, getImageSrcSet } from "../utils/cloudinary";

function GalleryCard({ item, onSelect }) {
  const { title, category, description, image } = item;
  const optimizedImg = getOptimizedImageUrl(image, { width: 600, height: 450, crop: "fill" });

  return (
    <div
      className="gallery-item"
      onClick={() => onSelect && onSelect(item)}
      role="button"
      tabIndex={0}
      aria-label={`View ${title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSelect) onSelect(item);
      }}
    >
      <img
        className="gallery-image"
        src={optimizedImg}
        srcSet={getImageSrcSet(image, [320, 480, 600])}
        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={title}
        loading="lazy"
        width="600"
        height="450"
      />
      <div className="gallery-overlay">
        <span className="gallery-tag">{category}</span>
        <h4 className="gallery-title">{title}</h4>
        {description && <p className="gallery-desc">{description}</p>}
      </div>
    </div>
  );
}

export default GalleryCard;
