import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProductBySlug, getAvailability, getQuote } from "../services/api";
import { formatPaise, formatISTDisplay } from "../utils/money";
import { getOptimizedImageUrl, getImageSrcSet } from "../utils/cloudinary";
import { useShop } from "../context/ShopContext";
import { usePublicSettings } from "../context/SettingsContext";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { ErrorState } from "../components/common/ErrorState";
import SEO from "../components/SEO";
import { buildProductJsonLd, buildBreadcrumbJsonLd } from "../utils/jsonLd";
import { trackViewItem } from "../utils/analytics";
import "../styles/productDetail.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { cleanWhatsapp, serviceablePincodes, business } = usePublicSettings();
  const { addToCart, isInWishlist, toggleWishlist } = useShop();

  // 1. Fetch Product Data
  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ["product-detail", slug],
    queryFn: async () => {
      const res = await getProductBySlug(slug);
      return res.data?.data;
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const product = productData?.product;
  const relatedProducts = productData?.related || [];

  // Track product view in analytics
  useEffect(() => {
    if (product) {
      trackViewItem(product);
    }
  }, [product]);

  // Active gallery index
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Selected Variants state: map of variantName -> optionLabel
  const [selectedVariants, setSelectedVariants] = useState({});

  // Initialize variants when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const initial = {};
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0].label;
        }
      });
      setSelectedVariants(initial);
    }
  }, [product]);

  // Selected Add-ons: set of addOnIds
  const [selectedAddOns, setSelectedAddOns] = useState(new Set());

  // Date and Slot Selection
  const todayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Earliest next day
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [pincodeInput, setPincodeInput] = useState("122001");
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Pincode serviceability check
  const handlePincodeCheck = () => {
    const code = pincodeInput.trim();
    if (!code || code.length !== 6) {
      setPincodeStatus({ valid: false, message: "Enter a valid 6-digit Gurugram pincode" });
      return;
    }
    const match = serviceablePincodes.find((p) => p.pincode === code);
    if (match || code.startsWith("122")) {
      const fee = match?.deliveryFeePaise || 0;
      setPincodeStatus({
        valid: true,
        message: fee === 0 ? "✓ Free Delivery & Setup in this area!" : `✓ Serviceable (Delivery fee: ${formatPaise(fee)})`,
      });
    } else {
      setPincodeStatus({
        valid: false,
        message: "Currently we only serve Gurugram (Pincodes 122xxx). Contact us for custom arrangements.",
      });
    }
  };

  // 2. Availability Query for selected date
  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
  } = useQuery({
    queryKey: ["availability", selectedDate, product?._id, pincodeInput],
    queryFn: async () => {
      if (!selectedDate) return null;
      const res = await getAvailability({
        date: selectedDate,
        productId: product?._id,
        pincode: pincodeInput,
      });
      return res.data?.data;
    },
    enabled: !!selectedDate && !!product?._id,
    staleTime: 15 * 1000,
  });

  const slots = availabilityData?.slots || [];

  // 3. Live Price from POST /api/quotes
  const quoteVariantSelections = useMemo(() => {
    return Object.entries(selectedVariants).map(([name, optionLabel]) => ({
      name,
      optionLabel,
    }));
  }, [selectedVariants]);

  const quotePayload = useMemo(() => {
    if (!product?._id) return null;
    return {
      items: [
        {
          productId: product._id,
          variantSelections: quoteVariantSelections,
          addOnIds: Array.from(selectedAddOns),
          quantity: 1,
        },
      ],
      pincode: pincodeInput,
    };
  }, [product?._id, quoteVariantSelections, selectedAddOns, pincodeInput]);

  const { data: quoteResult } = useQuery({
    queryKey: ["product-live-quote", quotePayload],
    queryFn: async () => {
      if (!quotePayload) return null;
      const res = await getQuote(quotePayload);
      return res.data?.data;
    },
    enabled: !!quotePayload,
    staleTime: 30 * 1000,
  });

  const livePricePaise = quoteResult?.pricing?.totalPaise ?? product?.basePricePaise ?? 0;

  // Add to Bag action
  const handleAddToBag = () => {
    if (!selectedSlotKey) {
      alert("Please select a time slot for setup");
      return;
    }

    addToCart({
      productId: product._id,
      variantSelections: quoteVariantSelections,
      addOnIds: Array.from(selectedAddOns),
      quantity: 1,
      date: selectedDate,
      slotKey: selectedSlotKey,
      title: product.title,
    });
  };

  const handleBookNow = () => {
    handleAddToBag();
    navigate("/checkout");
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
    : [{ url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80", alt: product.title }];

  const activeImg = images[activeImageIdx] || images[0];
  const isSaved = isInWishlist(product._id);

  // WhatsApp inquiry URL
  const waMsg = `Hi Decor Joy Gurgaon! I'm interested in "${product.title}" (${formatPaise(livePricePaise)}) for date ${selectedDate}. Is this available?`;
  const waUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(waMsg)}`;

  const productSchema = buildProductJsonLd(product, business);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: product.title, url: `/p/${product.slug}` },
  ]);

  return (
    <div className="product-page">
      <SEO
        title={`${product.title} | Decor Joy Gurgaon`}
        description={
          product.description
            ? product.description.slice(0, 160)
            : `Book ${product.title} in Gurgaon. Professional balloon decoration, themed backdrops, and same-day event setups starting ₹${((product.basePricePaise || 0) / 100).toFixed(0)}.`
        }
        canonical={`/p/${product.slug}`}
        ogType="product"
        ogImage={activeImg.url}
        ogPrice={{
          amount: ((product.basePricePaise || 0) / 100).toFixed(2),
          currency: "INR",
        }}
        jsonLd={[productSchema, breadcrumbSchema]}
      />
      {/* Breadcrumb */}
      <nav className="container product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span className="current">{product.title}</span>
      </nav>

      <section className="container product-main-grid">
        {/* Left Column: Gallery */}
        <div className="product-gallery">
          <div className="main-image-wrap">
            <img
              src={getOptimizedImageUrl(activeImg.url, { width: 800, height: 600, crop: "fill" })}
              srcSet={getImageSrcSet(activeImg.url, [480, 768, 960])}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt={activeImg.alt || product.title}
              width="800"
              height="600"
              className="main-image"
            />
            {product.badge && <span className="product-badge-overlay">{product.badge}</span>}
            <button
              type="button"
              className={`wishlist-fab ${isSaved ? "saved" : ""}`}
              onClick={() => toggleWishlist(product)}
              aria-label={isSaved ? "Remove from saved" : "Save setup"}
            >
              {isSaved ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumb-btn ${idx === activeImageIdx ? "active" : ""}`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  <img
                    src={getOptimizedImageUrl(img.url, { width: 120, height: 90, crop: "fill" })}
                    alt={img.alt || `Thumb ${idx + 1}`}
                    loading="lazy"
                    width="120"
                    height="90"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Configuration & Details */}
        <div className="product-details-col">
          <div className="product-header-meta">
            <span className="product-cat-tag">{product.categoryId?.name || "Event Setup"}</span>
            {product.ratingAvg > 0 && (
              <span className="product-star-tag">★ {product.ratingAvg.toFixed(1)} ({product.ratingCount || 1} reviews)</span>
            )}
          </div>

          <h1 className="product-h1">{product.title}</h1>

          <div className="live-pricing-bar">
            <span className="price-big">{formatPaise(livePricePaise)}</span>
            {product.compareAtPricePaise > livePricePaise && (
              <span className="price-compare">{formatPaise(product.compareAtPricePaise)}</span>
            )}
            <span className="price-note">All taxes & on-site styling included</span>
          </div>

          <p className="product-short-desc">{product.shortDescription}</p>

          {/* Variants Builder (Size, Colour, Theme) */}
          {(product.variants || []).map((v) => (
            <div key={v.name} className="variant-group">
              <label className="variant-label">
                Select {v.name}: <strong>{selectedVariants[v.name]}</strong>
              </label>
              <div className="variant-options">
                {(v.options || []).map((opt) => {
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
                      {opt.priceDeltaPaise > 0 && (
                        <span className="delta">+{formatPaise(opt.priceDeltaPaise)}</span>
                      )}
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
                        <span className="addon-price">+{formatPaise(addon.pricePaise)}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Slot Picker driven by /api/availability */}
          <div className="schedule-section">
            <h4 className="schedule-title">📅 Choose Event Date & Setup Slot</h4>
            <div className="schedule-row">
              <div className="schedule-field">
                <label className="field-lbl">Event Date</label>
                <input
                  type="date"
                  className="schedule-input"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotKey("");
                  }}
                />
              </div>

              <div className="schedule-field">
                <label className="field-lbl">Time Slot</label>
                <select
                  className="schedule-input"
                  value={selectedSlotKey}
                  onChange={(e) => setSelectedSlotKey(e.target.value)}
                  disabled={isAvailabilityLoading}
                >
                  <option value="">-- Choose Slot --</option>
                  {slots.map((s) => (
                    <option
                      key={s.key}
                      value={s.key}
                      disabled={!s.isAvailable}
                    >
                      {s.label} ({s.startTime} - {s.endTime}) {s.isAvailable ? `[${s.remainingCapacity} left]` : "[FULL]"}
                    </option>
                  ))}
                  {slots.length === 0 && (
                    <option value="evening">Evening Slot (16:30 - 19:30)</option>
                  )}
                </select>
              </div>
            </div>

            {availabilityData?.blackout && (
              <div className="blackout-warning">
                ⚠️ Selected date is unavailable due to holiday blackout. Please pick another date.
              </div>
            )}
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

          {/* Included Items */}
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

          {/* Desktop Action Buttons */}
          <div className="desktop-actions">
            <button
              type="button"
              className="btn btn-gold action-btn"
              onClick={handleBookNow}
            >
              Book Now (₹{Math.round(livePricePaise / 100).toLocaleString("en-IN")}) ➔
            </button>
            <button
              type="button"
              className="btn btn-outline action-btn"
              onClick={handleAddToBag}
            >
              Add to Celebration Bag 🛍️
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp action-btn"
            >
              Chat on WhatsApp 💬
            </a>
          </div>
        </div>
      </section>

      {/* Related Setups */}
      {relatedProducts.length > 0 && (
        <section className="container related-section">
          <h2 className="related-title">You May Also Like</h2>
          <div className="related-grid">
            {relatedProducts.map((rel) => (
              <Link key={rel._id} to={`/p/${rel.slug}`} className="related-card">
                <img
                  src={getOptimizedImageUrl(rel.images?.[0]?.url || "", { width: 400, height: 300, crop: "fill" })}
                  alt={rel.title}
                  loading="lazy"
                  width="400"
                  height="300"
                />
                <div className="related-info">
                  <h4>{rel.title}</h4>
                  <span>Starts at {formatPaise(rel.basePricePaise)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom "Book Now" Bar on Mobile (>=44px touch targets) */}
      <div className="mobile-sticky-bar">
        <div className="sticky-price-wrap">
          <span className="sticky-price-label">Total Setup:</span>
          <span className="sticky-price-val">{formatPaise(livePricePaise)}</span>
        </div>
        <div className="sticky-btns">
          <button
            type="button"
            className="btn btn-gold sticky-btn"
            onClick={handleBookNow}
          >
            Book Now ➔
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp sticky-btn-icon"
            aria-label="Inquire on WhatsApp"
          >
            💬
          </a>
        </div>
      </div>
    </div>
  );
}
