import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProductBySlug } from "../services/api";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import { useShop } from "../context/ShopContext";
import { usePublicSettings } from "../context/SettingsContext";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { ErrorState } from "../components/common/ErrorState";
import SEO from "../components/SEO";
import { buildProductJsonLd, buildBreadcrumbJsonLd } from "../utils/jsonLd";
import { trackViewItem } from "../utils/analytics";
import { FALLBACK_PRODUCTS } from "../data/fallbackData";
import "../styles/productDetail.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { cleanWhatsapp, business } = usePublicSettings();
  const { isInWishlist, toggleWishlist } = useShop();

  // 1. Fetch Package Data
  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ["product-detail", slug],
    queryFn: async () => {
      try {
        const res = await getProductBySlug(slug);
        if (res.data?.data?.product) return res.data.data;
      } catch {
        // Fallback when backend is offline
      }
      const matched = FALLBACK_PRODUCTS.find((p) => p.slug === slug) || FALLBACK_PRODUCTS[0];
      const related = FALLBACK_PRODUCTS.filter((p) => p.slug !== matched?.slug).slice(0, 3);
      return { product: matched, related };
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const product = productData?.product;
  const relatedProducts = productData?.related || [];

  // Track package view in analytics
  useEffect(() => {
    if (product) {
      trackViewItem(product);
    }
  }, [product]);

  // Active gallery index
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Customization selections
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedAddOns, setSelectedAddOns] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState("");
  const [preferredSlot, setPreferredSlot] = useState("evening");
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Initialize variants
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaults = {};
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          defaults[v.name] = v.options[0].label;
        }
      });
      setSelectedVariants(defaults);
    }
  }, [product]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const handlePincodeCheck = () => {
    const pin = pincodeInput.trim();
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      setPincodeStatus({ valid: false, message: "Please enter a valid 6-digit Gurgaon pincode." });
      return;
    }
    // Gurgaon pincodes start with 122
    if (pin.startsWith("122")) {
      setPincodeStatus({ valid: true, message: "✓ Free Setup & On-Time Delivery Available in Gurgaon!" });
    } else {
      setPincodeStatus({ valid: true, message: "✓ Available across Delhi NCR. Contact us for delivery details." });
    }
  };

  if (isProductLoading) {
    return (
      <div className="container" style={{ padding: "40px 16px" }}>
        <LoadingSkeleton count={3} type="detail" />
      </div>
    );
  }

  if (isProductError || !product) {
    return (
      <div className="container" style={{ padding: "40px 16px" }}>
        <ErrorState
          title="Setup Not Found"
          message={productError?.response?.data?.message || "The requested decoration package could not be found."}
          onRetry={() => refetchProduct()}
        />
      </div>
    );
  }

  const images = (product.images && product.images.length > 0)
    ? product.images
    : [{ url: "/decor-gallery/decor_001.jpg", alt: product.title }];

  const activeImg = images[activeImageIdx] || images[0];
  const isSaved = isInWishlist(product._id);

  // Build descriptive WhatsApp inquiry message
  const variantSummary = Object.entries(selectedVariants)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const addonNames = Array.from(selectedAddOns)
    .map((id) => product.addOnIds?.find((a) => a._id === id)?.name)
    .filter(Boolean)
    .join(", ");

  let waMsg = `Hi Decor Joy, I'm interested in the "${product.title}" decoration setup. I'd like to know availability, customization options and pricing.`;
  if (selectedDate) {
    waMsg += `\n📅 Preferred Date: ${selectedDate}`;
  }
  if (preferredSlot) {
    waMsg += `\n⏰ Preferred Timing: ${preferredSlot === "morning" ? "Morning (09:00 - 13:00)" : preferredSlot === "afternoon" ? "Afternoon (13:00 - 17:00)" : "Evening (17:00 - 21:00)"}`;
  }
  if (variantSummary) {
    waMsg += `\n🎨 Preferences: ${variantSummary}`;
  }
  if (addonNames) {
    waMsg += `\n✨ Optional Add-ons: ${addonNames}`;
  }
  waMsg += `\n\nLooking forward to hearing from you!`;

  const waUrl = `https://wa.me/${cleanWhatsapp || "917015767715"}?text=${encodeURIComponent(waMsg)}`;

  const productSchema = buildProductJsonLd(product, business);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Catalog", url: "/shop" },
    { name: product.title, url: `/p/${product.slug}` },
  ]);

  return (
    <div className="product-page">
      <SEO
        title={`${product.title} | Luxury Event Decoration in Gurgaon`}
        description={
          product.description
            ? product.description.slice(0, 160)
            : `Book ${product.title} in Gurgaon. Professional balloon decoration, themed backdrops, and same-day event setups. Get a transparent custom quote on WhatsApp.`
        }
        canonical={`/p/${product.slug}`}
        ogType="product"
        ogImage={activeImg.url}
        jsonLd={[productSchema, breadcrumbSchema]}
      />

      {/* Breadcrumb */}
      <nav className="container product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Catalog</Link>
        <span>/</span>
        <span className="current">{product.title}</span>
      </nav>

      <section className="container product-main-grid">
        {/* Left Column: Gallery */}
        <div className="product-gallery">
          <div className="main-image-wrap">
            <img
              src={getOptimizedImageUrl(activeImg.url, { width: 800, height: 600, crop: "fill" })}
              alt={activeImg.alt || product.title}
              className="main-product-img"
              width="800"
              height="600"
            />
            {product.badge && <span className="product-badge-overlay">{product.badge}</span>}
            <button
              type="button"
              className={`wishlist-btn-overlay ${isSaved ? "saved" : ""}`}
              onClick={() => toggleWishlist(product)}
              aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            >
              {isSaved ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="thumb-row" role="tablist" aria-label="Product Images">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumb-btn ${idx === activeImageIdx ? "active" : ""}`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  <img
                    src={getOptimizedImageUrl(img.url, { width: 120, height: 90, crop: "fill" })}
                    alt={img.alt || `${product.title} thumbnail ${idx + 1}`}
                    loading="lazy"
                    width="120"
                    height="90"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Inquiry CTAs */}
        <div className="product-details-col">
          <div className="category-tag">
            🎉 Occasion: <strong>{product.categoryId?.name || "Bespoke Event Setup"}</strong>
          </div>

          <h1 className="product-title">{product.title}</h1>

          {/* Pricing showcase */}
          <div className="pricing-block">
            {product.basePricePaise > 0 ? (
              <div className="starting-price-pill">
                <span>Starting from</span>
                <strong style={{ fontSize: "1.35rem", color: "var(--gold, #b88932)", marginLeft: "6px" }}>
                  ₹{(product.basePricePaise / 100).toLocaleString("en-IN")}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "6px" }}>(indicative)</span>
              </div>
            ) : (
              <div className="starting-price-pill">
                <span>Pricing:</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--gold, #b88932)", marginLeft: "6px" }}>
                  Custom Quote on WhatsApp
                </strong>
              </div>
            )}
            <span className="price-note">
              ✨ Free Setup, Delivery & Takedown across Gurgaon
            </span>
          </div>

          <p className="product-description">{product.description}</p>

          {/* Variants Selector */}
          {product.variants && product.variants.map((v) => (
            <div key={v.name} className="variant-section">
              <label className="variant-label">
                {v.name}: <strong>{selectedVariants[v.name]}</strong>
              </label>
              <div className="variant-pills">
                {v.options && v.options.map((opt) => {
                  const isSelected = selectedVariants[v.name] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      className={`variant-pill ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedVariants({ ...selectedVariants, [v.name]: opt.label })}
                    >
                      {opt.colorCode && (
                        <span
                          className="color-dot"
                          style={{ backgroundColor: opt.colorCode }}
                        />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add-ons Builder */}
          {product.addOnIds && product.addOnIds.length > 0 && (
            <div className="addons-section">
              <h4 className="addons-title">Enhance Your Celebration (Optional Add-ons)</h4>
              <div className="addons-grid">
                {product.addOnIds.map((addon) => {
                  const isChecked = selectedAddOns.has(addon._id);
                  return (
                    <label key={addon._id} className={`addon-card ${isChecked ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = new Set(selectedAddOns);
                          if (e.target.checked) updated.add(addon._id);
                          else updated.delete(addon._id);
                          setSelectedAddOns(updated);
                        }}
                      />
                      <div className="addon-info">
                        <span className="addon-name">{addon.name}</span>
                        <span className="addon-price" style={{ color: "var(--gold)" }}>✓ Custom Add-on</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Preferred Setup Timing */}
          <div className="schedule-section">
            <h4 className="schedule-title">📅 Preferred Event Date & Setup Timing</h4>
            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-lbl">Event Date</label>
                <input
                  type="date"
                  className="schedule-input"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="schedule-field">
                <label className="field-lbl">Setup Time Window</label>
                <select
                  className="schedule-input"
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                >
                  <option value="morning">Morning (09:00 AM - 01:00 PM)</option>
                  <option value="afternoon">Afternoon (01:00 PM - 05:00 PM)</option>
                  <option value="evening">Evening (05:00 PM - 09:00 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pincode Serviceability */}
          <div className="pincode-section">
            <label className="field-lbl">Check Delivery in Gurgaon</label>
            <div className="pincode-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                enterKeyHint="go"
                maxLength="6"
                placeholder="Enter 6-digit Pincode"
                className="pincode-input"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline pincode-btn"
                onClick={handlePincodeCheck}
              >
                Check
              </button>
            </div>
            {pincodeStatus && (
              <div className={`pincode-msg ${pincodeStatus.valid ? "success" : "error"}`}>
                {pincodeStatus.message}
              </div>
            )}
          </div>

          {/* What's Included */}
          {product.includedItems && product.includedItems.length > 0 && (
            <div className="included-section">
              <h4 className="included-title">What's Included in this Package:</h4>
              <ul className="included-list">
                {product.includedItems.map((item, idx) => (
                  <li key={idx}>✓ {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Primary Action Buttons (Catalogue + WhatsApp Model) */}
          <div className="desktop-actions">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp action-btn"
              style={{ flex: 1.5, textAlign: "center", textDecoration: "none", fontSize: "1.02rem" }}
            >
              💬 Enquire on WhatsApp
            </a>
            <button
              type="button"
              className="btn btn-gold action-btn"
              onClick={() => navigate(`/plan-my-event?package=${product.slug}`)}
              style={{ flex: 1 }}
            >
              ✨ Plan a Similar Event
            </button>
          </div>
        </div>
      </section>

      {/* Related Packages */}
      {relatedProducts.length > 0 && (
        <section className="container related-section">
          <h2 className="related-title">You May Also Like</h2>
          <div className="related-grid">
            {relatedProducts.map((rel) => (
              <Link key={rel._id} to={`/p/${rel.slug}`} className="related-card">
                <img
                  src={getOptimizedImageUrl(rel.images?.[0]?.url || "/decor-gallery/decor_001.jpg", { width: 400, height: 300, crop: "fill" })}
                  alt={rel.title}
                  loading="lazy"
                  width="400"
                  height="300"
                />
                <div className="related-info">
                  <h4>{rel.title}</h4>
                  <span style={{ color: "var(--gold)" }}>✓ Custom Quote on WhatsApp</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom Bar on Mobile */}
      <div className="mobile-sticky-bar">
        <div className="sticky-price-wrap">
          <span className="sticky-price-label">Decoration Package:</span>
          <span className="sticky-price-val" style={{ fontSize: "0.92rem", color: "#16a34a" }}>
            Instant WhatsApp Quote
          </span>
        </div>
        <div className="sticky-btns">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp sticky-btn"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 2 }}
          >
            <span>💬</span> Enquire on WhatsApp
          </a>
          <button
            type="button"
            className="btn btn-gold sticky-btn-icon"
            onClick={() => navigate(`/plan-my-event?package=${product.slug}`)}
            aria-label="Plan a Similar Event"
            title="Plan a Similar Event"
          >
            ✨
          </button>
        </div>
      </div>
    </div>
  );
}
