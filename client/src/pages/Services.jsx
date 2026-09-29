import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import WhatsAppButton from "../components/WhatsAppButton";
import { getServices } from "../services/api";
import "../styles/services.css";

const CATEGORIES = [
  "All",
  "Birthdays",
  "Anniversaries",
  "Baby Showers",
  "Proposals",
  "Special Celebrations",
];

const PRICE_FILTERS = [
  { id: "all", label: "All Prices" },
  { id: "under3500", label: "Under ₹3,500" },
  { id: "3500to6000", label: "₹3,500 - ₹6,000" },
  { id: "above6000", label: "Luxury (₹6,000+)" },
];

const COLOR_FILTERS = [
  { id: "all", label: "All Colors", code: "" },
  { id: "Rose Gold", label: "Rose Gold", code: "#d48b8b" },
  { id: "Champagne Gold", label: "Gold", code: "#c59b27" },
  { id: "Warm White", label: "Warm White", code: "#faf8f5" },
  { id: "Sage Green", label: "Sage Green", code: "#84a98c" },
  { id: "Pastel Multitone", label: "Pastels", code: "#f3c68f" },
];

const MATERIAL_FILTERS = [
  "All Materials",
  "Organic Latex & Neon",
  "Latex & Foil",
  "Sheer Fabric & Lights",
  "Marquee Lights & Florals",
];

function Services() {
  const routerLocation = useLocation();
  const searchParams = new URLSearchParams(routerLocation.search);
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activePrice, setActivePrice] = useState("all");
  const [activeColor, setActiveColor] = useState("all");
  const [activeMaterial, setActiveMaterial] = useState("All Materials");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  // Sync category if URL query parameter changes
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setActiveCategory(cat);
    const s = searchParams.get("search");
    if (s) setSearchQuery(s);
  }, [routerLocation.search]);

  useEffect(() => {
    fetchServices(activeCategory);
  }, [activeCategory]);

  const fetchServices = async (category) => {
    try {
      setLoading(true);
      const res = await getServices(category);
      setServices(res.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort items
  const filteredServices = services
    .filter((s) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchCat = s.category?.toLowerCase().includes(q);
        const matchColor = s.color?.toLowerCase().includes(q);
        const matchMat = s.material?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchColor && !matchMat) return false;
      }

      // 2. Price Filter
      if (activePrice === "under3500" && s.startingPrice >= 3500) return false;
      if (activePrice === "3500to6000" && (s.startingPrice < 3500 || s.startingPrice > 6000)) return false;
      if (activePrice === "above6000" && s.startingPrice <= 6000) return false;

      // 3. Color Filter
      if (activeColor !== "all" && s.color !== activeColor) return false;

      // 4. Material Filter
      if (activeMaterial !== "All Materials" && s.material !== activeMaterial) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.startingPrice - b.startingPrice;
      if (sortBy === "price_desc") return b.startingPrice - a.startingPrice;
      if (sortBy === "rating") return (b.rating || 4.9) - (a.rating || 4.9);
      return 0; // default / featured
    });

  const hasActiveFilters =
    activeCategory !== "All" ||
    activePrice !== "all" ||
    activeColor !== "all" ||
    activeMaterial !== "All Materials" ||
    searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setActiveCategory("All");
    setActivePrice("all");
    setActiveColor("all");
    setActiveMaterial("All Materials");
    setSearchQuery("");
    setSortBy("featured");
  };

  return (
    <div className="services-page">
      <section className="section">
        <div className="container">
          {/* Header */}
          <div className="section-header">
            <span className="section-tagline">Curated Catalog</span>
            <h1 className="section-title">Celebration Styling Packages</h1>
            <p className="section-subtitle">
              Browse transparently priced event setups across Gurgaon. Filter by occasion, color scheme, or material to discover your perfect look.
            </p>
            <div className="gold-divider"></div>
          </div>

          {/* Category Filter Chips */}
          <div className="services-filter-bar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Multi-Attribute Filter & Sort Toolbar */}
          <div
            className="filter-toolbar"
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 24px",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Row 1: Search & Sort */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              {/* Search box */}
              <div style={{ flex: "1 1 280px", position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Filter by keyword (e.g. arch, cabana, neon, safari)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border)",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Sort by Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Sort:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border)",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    background: "var(--white)",
                    color: "var(--dark)",
                    cursor: "pointer",
                  }}
                >
                  <option value="featured">✨ Featured Setups</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated (★ 4.9+)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Secondary Attributes (Price, Color, Material) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              {/* Price Range Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Price:
                </span>
                {PRICE_FILTERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePrice(p.id)}
                    style={{
                      background: activePrice === p.id ? "var(--dark)" : "var(--surface-alt)",
                      color: activePrice === p.id ? "var(--white)" : "var(--text)",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "var(--transition)",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Color Swatch Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Palette:
                </span>
                {COLOR_FILTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveColor(c.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: activeColor === c.id ? "var(--dark)" : "var(--surface-alt)",
                      color: activeColor === c.id ? "var(--white)" : "var(--text)",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "var(--transition)",
                    }}
                  >
                    {c.code && (
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: c.code,
                          border: "1px solid rgba(0,0,0,0.2)",
                        }}
                      />
                    )}
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Material Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Material:
                </span>
                <select
                  value={activeMaterial}
                  onChange={(e) => setActiveMaterial(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    background: "var(--surface-alt)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  {MATERIAL_FILTERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Action */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginLeft: "auto",
                  }}
                >
                  Clear All Filters ✕
                </button>
              )}
            </div>
          </div>

          {/* Results Count Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              fontSize: "0.88rem",
              color: "var(--text-light)",
            }}
          >
            <span>
              Showing <strong>{filteredServices.length}</strong> celebration setups in Gurgaon
            </span>
            <span style={{ color: "var(--success)", fontWeight: 600 }}>
              ✓ 100% On-Time Setup & Damage-Free Adhesives Guaranteed
            </span>
          </div>

          {/* Services Grid */}
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>Loading decoration packages...</p>
          ) : filteredServices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-light)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
              <h3 style={{ color: "var(--dark)" }}>No matching packages found</h3>
              <p style={{ marginTop: "6px", fontSize: "0.9rem" }}>
                Try adjusting your search terms, color palette, or price range.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-outline"
                style={{ marginTop: "16px" }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          )}

          {/* Custom Pinterest Requirement Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--gold-light), #ffffff)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "44px clamp(20px, 4vw, 48px)",
              textAlign: "center",
              marginTop: "70px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="pulse-badge" style={{ marginBottom: "14px" }}>
              <span className="pulse-dot"></span>
              <span>Need Something Custom?</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.85rem", marginBottom: "12px", color: "var(--dark)" }}>
              Replicate a Pinterest / Instagram Photo Setup
            </h3>
            <p style={{ color: "var(--text-light)", maxWidth: "620px", margin: "0 auto 28px", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Have a specific moodboard or Instagram reel you fell in love with? Share your reference photo directly with our styling lead on WhatsApp for an immediate quote!
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/#decor-builder" className="btn btn-gold">
                Open Decor Customizer ✨
              </Link>
              <WhatsAppButton
                text="Share Reference on WhatsApp"
                message="Hello Decor Joy Gurgaon! I have a Pinterest/Instagram photo reference I'd like a quote for."
                className="btn btn-whatsapp"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Quick Action Button */}
      <WhatsAppButton isFloating={true} />
    </div>
  );
}

export default Services;
