import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Hero from "../components/Hero";
import ServiceCard from "../components/ServiceCard";
import GalleryCard from "../components/GalleryCard";
import TestimonialCard from "../components/TestimonialCard";
import WhatsAppButton from "../components/WhatsAppButton";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { ErrorState } from "../components/common/ErrorState";
import { getPublicProducts, getGallery, getTestimonials } from "../services/api";
import { usePublicSettings } from "../context/SettingsContext";
import { DECOR_GALLERY } from "../data/decorGalleryData";
import { FALLBACK_PRODUCTS, FALLBACK_TESTIMONIALS } from "../data/fallbackData";
import SEO from "../components/SEO";
import { buildLocalBusinessJsonLd } from "../utils/jsonLd";
import "../styles/services.css";
import "../styles/gallery.css";

function Home() {
  const [selectedImage, setSelectedImage] = useState(null);

  // Close lightbox on Escape key
  const closeLightbox = useCallback(() => closeLightbox(), []);
  useEffect(() => {
    if (!selectedImage) return;
    const onKey = (e) => { if (e.key === "Escape") closeLightbox(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedImage, closeLightbox]);

  // 1. Featured Setups Query (with graceful offline fallback)
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      try {
        const res = await getPublicProducts({ limit: 3 });
        const prods = res.data?.data?.products || [];
        if (prods.length > 0) return prods;
      } catch {
        // Fallback when MongoDB / backend is offline
      }
      return FALLBACK_PRODUCTS.slice(0, 3);
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // 2. Gallery Query (falls back to authentic DECOR_GALLERY items)
  const {
    data: galleryData,
    isLoading: isGalleryLoading,
    isError: isGalleryError,
    refetch: refetchGallery,
  } = useQuery({
    queryKey: ["home-gallery"],
    queryFn: async () => {
      try {
        const res = await getGallery();
        const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (items.length > 0) return items.slice(0, 6);
      } catch {
        // Fallback to top featured authentic setups
      }
      return DECOR_GALLERY.filter((item) => item.isFeatured).slice(0, 6);
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // 3. Testimonials Query (with graceful offline fallback)
  const {
    data: testimonialsData,
    isLoading: isTestimonialsLoading,
  } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: async () => {
      try {
        const res = await getTestimonials();
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (list.length > 0) return list;
      } catch {
        // Fallback when MongoDB is offline
      }
      return FALLBACK_TESTIMONIALS;
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const services = productsData || [];
  const gallery = galleryData || [];
  const testimonials = testimonialsData || [];
  const { business } = usePublicSettings();
  const localBusinessSchema = buildLocalBusinessJsonLd(business);

  return (
    <div className="home-page">
      <SEO
        title="Decor Joy Gurgaon | Best Balloon & Event Decoration Services in Gurugram"
        description="Gurgaon's top event decoration service operating since 2021. Same-day balloon decoration, birthdays, romantic cabanas, baby showers across DLF, Golf Course Road, Cyber City, and Sohna Road."
        canonical="/"
        jsonLd={localBusinessSchema}
      />
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Services Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">What We Create</span>
            <h2 className="section-title">Signature Celebrations</h2>
            <p className="section-subtitle">
              From intimate surprise setups to grand birthday themes, explore our curated decoration packages crafted with love and attention to detail.
            </p>
            <div className="gold-divider"></div>
          </div>

          {isProductsLoading ? (
            <LoadingSkeleton count={3} type="card" />
          ) : isProductsError ? (
            <ErrorState
              title="Unable to load packages"
              message="Could not load our decoration packages. Please check your connection."
              onRetry={() => refetchProducts()}
            />
          ) : services.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-light)" }}>
              <p>No featured packages found. Browse our shop for available setups!</p>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "45px" }}>
            <Link to="/shop" className="btn btn-gold">
              Explore All Setups & Packages ðŸŽˆ
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us Section */}
      <section className="section section-bg-light">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Why Choose Us</span>
            <h2 className="section-title">The Decor Joy Promise</h2>
            <p className="section-subtitle">
              We understand that every celebration marks a unique milestone. Here is why Gurgaon families and couples trust us.
            </p>
            <div className="gold-divider"></div>
          </div>

          <div className="why-choose-grid">
            <div className="why-card">
              <div className="why-icon-box">ðŸŽ¨</div>
              <h3 className="why-card-title">Creative Designs</h3>
              <p className="why-card-desc">
                Fresh, contemporary balloon aesthetics, bespoke color palettes, and captivating focal points tailored to your vision.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon-box">âœ¨</div>
              <h3 className="why-card-title">Personalized Decorations</h3>
              <p className="why-card-desc">
                Every event is customized with tailored names, ages, themes, floral touches, and glowing LED neon letters.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon-box">ðŸ’Ž</div>
              <h3 className="why-card-title">Quality Materials</h3>
              <p className="why-card-desc">
                We use high-grade, durable latex and chrome balloons, premium fabrics, and spotless props that look exquisite in photos.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon-box">â±ï¸</div>
              <h3 className="why-card-title">On-Time Setup</h3>
              <p className="why-card-desc">
                Punctuality is our core commitment. We arrive and execute seamlessly well before your guests arrive.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon-box">ðŸ·ï¸</div>
              <h3 className="why-card-title">Affordable Packages</h3>
              <p className="why-card-desc">
                Honest, transparent pricing without hidden fees, giving you luxury event styling at pocket-friendly rates.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon-box">ðŸ“</div>
              <h3 className="why-card-title">Serving Gurgaon Since 2021</h3>
              <p className="why-card-desc">
                Trusted by hundreds of families across DLF, Golf Course Road, Sohna Road, and Sector 57 Gurugram.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Gallery Preview */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Our Portfolio</span>
            <h2 className="section-title">Moments Made Beautiful</h2>
            <p className="section-subtitle">
              Take a glimpse into our real setups across Gurugram. Click any image to see high resolution details.
            </p>
            <div className="gold-divider"></div>
          </div>

          {isGalleryLoading ? (
            <LoadingSkeleton count={6} type="card" />
          ) : isGalleryError ? (
            <ErrorState
              title="Unable to load gallery"
              message="Could not load portfolio photos. Please check your connection."
              onRetry={() => refetchGallery()}
            />
          ) : gallery.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>Portfolio photos coming soon.</p>
          ) : (
            <div className="gallery-grid">
              {gallery.map((item, idx) => (
                <GalleryCard key={item.id || item._id || idx} item={item} onSelect={setSelectedImage} index={idx} />
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "45px" }}>
            <Link to="/gallery" className="btn btn-outline">
              Explore Full Photo Gallery ðŸ“¸
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Testimonials Section */}
      <section className="section section-bg-light">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Client Reviews</span>
            <h2 className="section-title">Loved by Celebrators in Gurgaon</h2>
            <p className="section-subtitle">
              Read what our happy clients have to say about their special days.
            </p>
            <div className="gold-divider"></div>
          </div>

          {isTestimonialsLoading ? (
            <LoadingSkeleton count={3} type="card" />
          ) : testimonials.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>Reviews coming soon.</p>
          ) : (
            <div className="why-choose-grid">
              {testimonials.map((t) => (
                <TestimonialCard key={t._id} testimonial={t} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Final Call to Action Banner */}
      <section className="section" style={{ background: "linear-gradient(135deg, var(--gold-light), var(--cream))" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "800px" }}>
          <span className="section-tagline">Get Started</span>
          <h2 className="section-title" style={{ marginTop: "12px" }}>
            Let's Create Your Celebration
          </h2>
          <p className="section-subtitle" style={{ marginBottom: "32px" }}>
            Ready to turn your venue into an extraordinary celebration? Connect with Decor Joy Gurgaon on WhatsApp or send an inquiry today.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <WhatsAppButton
              text="Plan on WhatsApp (Fastest)"
              message="Hello Decor Joy Gurgaon! I'd love to book an event decoration with your team."
              className="btn btn-whatsapp"
            />
            <Link to="/contact" className="btn btn-gold">
              Submit Booking Form ðŸ“
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Image Preview */}
      {selectedImage && (
        <div className="lightbox-backdrop" onClick={() => closeLightbox()}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close-btn"
              onClick={() => closeLightbox()}
              aria-label="Close modal"
            >
              âœ•
            </button>
            <img
              src={selectedImage.src || selectedImage.image}
              alt={selectedImage.title}
              className="lightbox-image"
              width="800"
              height="600"
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

      {/* Floating WhatsApp Quick Action Button */}
      <WhatsAppButton isFloating={true} />
    </div>
  );
}

export default Home;

