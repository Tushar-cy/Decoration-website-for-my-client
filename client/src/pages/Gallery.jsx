import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import GalleryCard from "../components/GalleryCard";
import { getGallery } from "../services/api";
import { usePublicSettings } from "../context/SettingsContext";
import SEO from "../components/SEO";
import { buildBreadcrumbJsonLd } from "../utils/jsonLd";
import {
  DECOR_GALLERY,
  GALLERY_CATEGORIES,
} from "../data/decorGalleryData";
import "../styles/gallery.css";

const PAGE_SIZE = 12;

function Gallery() {
  const { cleanWhatsapp } = usePublicSettings();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedImage, setSelectedImage] = useState(null);

  // Optional backend API query to merge dynamic items if server is active
  const {
    data: apiGalleryItems = [],
  } = useQuery({
    queryKey: ["gallery", activeCategory],
    queryFn: async () => {
      try {
        const res = await getGallery(activeCategory);
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false, // Don't block or lag when offline
  });

  const allItems = useMemo(() => {
    if (!apiGalleryItems || apiGalleryItems.length === 0) {
      return DECOR_GALLERY;
    }
    const dynamicFormatted = apiGalleryItems.map((item, idx) => ({
      ...item,
      id: item._id || `dynamic_${idx}`,
      src: item.image,
      thumbUrl: item.image,
      qualityScore: 92,
      isFeatured: true,
      locality: "Gurgaon, Haryana",
    }));
    return [...dynamicFormatted, ...DECOR_GALLERY];
  }, [apiGalleryItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (activeCategory !== "All") {
        if (activeCategory === "Ring Backdrops") {
          if (item.category !== "Ring Backdrops" && !item.title.toLowerCase().includes("ring")) {
            return false;
          }
        } else if (item.category !== activeCategory) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || item.psychologyHeadline?.toLowerCase().includes(q);
        const matchesLocality = item.locality?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        const matchesFeatures = item.features?.some((f) => f.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesLocality && !matchesCat && !matchesFeatures) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, activeCategory, searchQuery]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortBy === "recommended") {
      list.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      });
    } else if (sortBy === "quality") {
      list.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    }
    return list;
  }, [filteredItems, sortBy]);

  const displayedItems = useMemo(() => {
    return sortedItems.slice(0, visibleCount);
  }, [sortedItems, visibleCount]);

  const hasMore = visibleCount < sortedItems.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  // Lightbox Next / Prev navigation
  const currentIndex = selectedImage
    ? sortedItems.findIndex((item) => item.id === selectedImage.id)
    : -1;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setSelectedImage(sortedItems[currentIndex - 1]);
    } else {
      setSelectedImage(sortedItems[sortedItems.length - 1]);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (currentIndex < sortedItems.length - 1) {
      setSelectedImage(sortedItems[currentIndex + 1]);
    } else {
      setSelectedImage(sortedItems[0]);
    }
  };

  // WhatsApp Message for Selected Modal Image
  const modalWhatsappMsg = selectedImage
    ? encodeURIComponent(
        `Hello Decor Joy Gurgaon! I am interested in this setup from your gallery:\n\n✨ *${selectedImage.title}*\n📍 *Location:* ${selectedImage.locality || "Gurgaon"}\n\nCould you please check availability and details for my celebration date?`
      )
    : "";

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Gallery", url: "/gallery" },
  ]);

  return (
    <div className="gallery-page">
      <SEO
        title="Event Decoration Portfolio & Real Photos | Decor Joy Gurgaon"
        description="Browse 250+ real client event setups across Gurgaon: balloon arches, circular ring backdrops, romantic cabanas, 1st birthdays, baby showers, and luxury sequin walls in DLF & Golf Course Road."
        canonical="/gallery"
        jsonLd={breadcrumbSchema}
      />

      <section className="section" style={{ paddingTop: "30px", paddingBottom: "50px" }}>
        <div className="container">
          {/* Header */}
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <span className="section-tagline">100% Authentic Gurgaon Setups</span>
            <h1 className="section-title">Celebration Showcase</h1>
            <p className="section-subtitle">
              Explore <strong>250+ unedited, real client setups</strong> crafted across Gurugram.
              Tap any setup to view inclusions and check WhatsApp availability.
            </p>
            <div className="gold-divider"></div>
          </div>

          {/* Sleek Mobile-Friendly Trust Pill Strip */}
          <div className="gallery-trust-strip">
            <div className="trust-strip-item">
              <span>📸</span> <strong>250+ Real Setups</strong>
            </div>
            <div className="trust-strip-separator">•</div>
            <div className="trust-strip-item">
              <span>⭐</span> <strong>4.9/5 Rating (850+ Clients)</strong>
            </div>
            <div className="trust-strip-separator">•</div>
            <div className="trust-strip-item">
              <span>⚡</span> <strong>2-Hour Setup Guarantee</strong>
            </div>
            <div className="trust-strip-separator">•</div>
            <div className="trust-strip-item">
              <span>💬</span> <strong>Fast WhatsApp Reply</strong>
            </div>
          </div>

          {/* Controls: Search + Categories */}
          <div className="gallery-controls-section">
            {/* Search and Sort Toolbar */}
            <div className="gallery-search-sort-bar">
              <div className="gallery-search-box">
                <span className="gallery-search-icon">🔍</span>
                <input
                  type="text"
                  className="gallery-search-input"
                  placeholder="Search neon, pastel, ring, cabana, DLF..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  aria-label="Search decoration setups"
                />
              </div>

              <div className="gallery-sort-box">
                <select
                  id="gallerySort"
                  className="gallery-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort gallery photos"
                >
                  <option value="recommended">🔥 Most Popular First</option>
                  <option value="quality">💎 Ultra HD Setups First</option>
                </select>
              </div>
            </div>

            {/* Horizontal Scrollable Category Chips */}
            <div className="gallery-category-chips-scroll">
              {GALLERY_CATEGORIES.map((cat) => {
                const count =
                  cat === "All"
                    ? allItems.length
                    : allItems.filter((i) =>
                        cat === "Ring Backdrops"
                          ? i.category === "Ring Backdrops" || i.title.toLowerCase().includes("ring")
                          : i.category === cat
                      ).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-chip-btn ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => {
                      setActiveCategory(cat);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <span>{cat}</span>
                    <span className="category-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Counter & Reset */}
          <div className="gallery-results-count">
            <span>
              Showing <strong>{displayedItems.length}</strong> of{" "}
              <strong>{sortedItems.length}</strong> setups
              {activeCategory !== "All" && ` in ${activeCategory}`}
            </span>
            {(searchQuery || activeCategory !== "All") && (
              <button
                type="button"
                className="btn-link"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--gold, #d4af37)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                }}
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                Reset Filters ✕
              </button>
            )}
          </div>

          {/* Photo Grid */}
          {displayedItems.length === 0 ? (
            <div className="gallery-empty-state">
              <div className="gallery-empty-icon">🎈</div>
              <h3 className="gallery-empty-title">No setups match your search</h3>
              <p className="gallery-empty-desc">
                Try searching for broader terms like "ring", "pastel", "neon", or reset the filter.
              </p>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
              >
                View All Setups
              </button>
            </div>
          ) : (
            <div className="gallery-grid">
              {displayedItems.map((item, idx) => (
                <GalleryCard key={item.id} item={item} index={idx} onSelect={setSelectedImage} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="gallery-load-more-container">
              <button
                type="button"
                className="gallery-btn-load-more"
                onClick={handleLoadMore}
              >
                <span>Load More Setups ({sortedItems.length - visibleCount} remaining)</span>
                <span>↓</span>
              </button>
            </div>
          )}

          {/* High-Converting Custom Request Card (Replaces external Google Photos leak) */}
          <div className="portfolio-banner">
            <span className="badge-gold" style={{ marginBottom: "12px", display: "inline-block" }}>
              Custom Design Replication
            </span>
            <h3 className="portfolio-banner-title">
              Have a Specific Pinterest or Instagram Look in Mind?
            </h3>
            <p className="portfolio-banner-desc">
              Every celebration is unique. Send us any reference screenshot, Pinterest pin, or reel on WhatsApp.
              Our Master Decorator will confirm exact customization and date availability in 5 minutes!
            </p>
            <div className="portfolio-banner-buttons">
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                  "Hello Decor Joy Gurgaon! I have a custom decoration idea I'd like to recreate for my event. Could you help me with details?"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
                style={{ minHeight: "48px", display: "inline-flex", alignItems: "center" }}
              >
                💬 Send Your Reference on WhatsApp
              </a>
              <Link
                to="/plan-my-event"
                className="btn btn-outline"
                style={{ minHeight: "48px", display: "inline-flex", alignItems: "center" }}
              >
                🎨 Plan Custom Event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setSelectedImage(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {sortedItems.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-nav-btn lightbox-prev"
                  onClick={handlePrevImage}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="lightbox-nav-btn lightbox-next"
                  onClick={handleNextImage}
                  aria-label="Next photo"
                >
                  ›
                </button>
              </>
            )}

            <div className="lightbox-media-column">
              <img
                src={selectedImage.src || selectedImage.image}
                alt={selectedImage.title}
                className="lightbox-image"
                width={selectedImage.width || 800}
                height={selectedImage.height || 1000}
              />
            </div>

            <div className="lightbox-details-column">
              <div className="lightbox-meta-top">
                <span className="badge-gold">{selectedImage.category}</span>
                {selectedImage.qualityTier && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#00a884",
                      background: "rgba(0, 168, 132, 0.12)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    ✓ {selectedImage.qualityTier}
                  </span>
                )}
              </div>

              <h2 className="lightbox-title">{selectedImage.title}</h2>

              <div className="lightbox-locality-row">
                <span>📍 {selectedImage.locality || "Gurgaon, Haryana"}</span>
                <span>•</span>
                <span>⭐ 5.0 (verified client setup)</span>
              </div>

              {selectedImage.psychologyHeadline && (
                <div className="lightbox-headline">
                  "{selectedImage.psychologyHeadline}"
                </div>
              )}

              {selectedImage.description && (
                <p className="lightbox-desc">{selectedImage.description}</p>
              )}

              <div className="lightbox-spec-box">
                <div className="lightbox-spec-title">Setup Inclusions:</div>
                <ul className="lightbox-spec-list">
                  {(selectedImage.features && selectedImage.features.length > 0
                    ? selectedImage.features
                    : [
                        "Premium Double-Stuffed Balloons",
                        "LED Warm Neon Backlight",
                        "Same-Day Setup in 2 Hours",
                        "Color Customization Included",
                      ]
                  ).map((f, idx) => (
                    <li key={idx} className="lightbox-spec-item">
                      {f}
                    </li>
                  ))}
                  <li className="lightbox-spec-item">Dedicated Decor Specialist</li>
                  <li className="lightbox-spec-item">Clean Teardown Support</li>
                </ul>
              </div>

              <div className="lightbox-cta-group">
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=${modalWhatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lightbox-btn-book"
                >
                  💬 Inquire Availability on WhatsApp
                </a>
                <Link
                  to="/plan-my-event"
                  className="lightbox-btn-custom"
                  onClick={() => setSelectedImage(null)}
                >
                  🎨 Request Custom Modifications
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
