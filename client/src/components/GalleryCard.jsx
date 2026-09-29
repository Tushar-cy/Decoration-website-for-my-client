import React from "react";

function GalleryCard({ item, onSelect }) {
  const { title, category, description, image } = item;

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
      <img className="gallery-image" src={image} alt={title} loading="lazy" />
      <div className="gallery-overlay">
        <span className="gallery-tag">{category}</span>
        <h4 className="gallery-title">{title}</h4>
        {description && <p className="gallery-desc">{description}</p>}
      </div>
    </div>
  );
}

export default GalleryCard;
