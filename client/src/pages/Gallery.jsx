import React, { useState, useEffect } from "react";
import GalleryCard from "../components/GalleryCard";
import WhatsAppButton from "../components/WhatsAppButton";
import { getGallery } from "../services/api";
import "../styles/gallery.css";

const GALLERY_CATEGORIES = [
  "All",
  "Birthday",
  "Anniversary",
  "Baby Shower",
  "Proposal",
  "Other",
];

function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery(activeCategory);
  }, [activeCategory]);

  const fetchGallery = async (category) => {
    try {
      setLoading(true);
      const res = await getGallery(category);
      setGalleryItems(res.data);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-page">
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Visual Portfolio</span>
            <h1 className="section-title">Celebration Showcase</h1>
            <p className="section-subtitle">
              Browse through our authentic work across Gurugram. Click any design to view full details and inquire for your date.
            </p>
            <div className="gold-divider"></div>
          </div>

          {/* Category Filter Chips */}
          <div className="services-filter-bar">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>Loading gallery photos...</p>
          ) : galleryItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-light)" }}>
              <p>No photos found in this category yet.</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <GalleryCard key={item._id} item={item} onSelect={setSelectedImage} />
              ))}
            </div>
          )}

          {/* External Google Photos Portfolio Banner */}
          <div className="portfolio-banner">
            <span className="badge-gold" style={{ marginBottom: "12px" }}>Extended Gallery</span>
            <h3 className="portfolio-banner-title">Want to see even more of our real client setups?</h3>
            <p className="portfolio-banner-desc">
              Explore our live Google Photos album containing hundreds of unedited celebration setups, birthday rings, and romantic terrace canopies across Gurgaon.
            </p>
            <a
              href="https://photos.app.goo.gl/bWGFDXU3Tjr8afQL9"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
            >
              Open Full Google Photos Album ↗
            </a>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close-btn"
              onClick={() => setSelectedImage(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <img
              src={selectedImage.image}
              alt={selectedImage.title}
              className="lightbox-image"
            />
            <div className="lightbox-info">
              <div>
                <span className="badge-gold">{selectedImage.category}</span>
                <h3 style={{ marginTop: "6px", fontFamily: "var(--font-heading)" }}>{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginTop: "4px" }}>
                    {selectedImage.description}
                  </p>
                )}
              </div>
              <WhatsAppButton
                text="Inquire This Look"
                message={`Hi Decor Joy Gurgaon! I like the "${selectedImage.title}" look from your gallery. Can you create something similar?`}
                className="btn btn-whatsapp"
              />
            </div>
          </div>
        </div>
      )}

      <WhatsAppButton isFloating={true} />
    </div>
  );
}

export default Gallery;
