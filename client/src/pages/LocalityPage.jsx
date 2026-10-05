import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LOCALITIES } from "../data/localities";
import { usePublicSettings } from "../context/SettingsContext";
import SEO from "../components/SEO";
import {
  buildLocalBusinessJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "../utils/jsonLd";
import "./LocalityPage.css";

export default function LocalityPage() {
  const { slug } = useParams();
  const { business, cleanWhatsapp } = usePublicSettings();
  const [openFaq, setOpenFaq] = useState(null);

  const locality = LOCALITIES[slug];

  if (!locality) {
    return (
      <div className="locality-not-found">
        <h1>Location Not Found</h1>
        <p>We serve all across Gurugram! Explore our full catalogue of decoration packages.</p>
        <Link to="/shop" className="locality-cta-btn">
          View All Packages
        </Link>
      </div>
    );
  }

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Structured Data Schemas
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Locations", url: "/locations/dlf-phase-5" },
    { name: locality.name, url: `/locations/${locality.slug}` },
  ]);

  const faqSchema = buildFaqJsonLd(locality.faqs);
  const localBusinessSchema = buildLocalBusinessJsonLd(business);

  const waMessage = encodeURIComponent(
    `Hi Decor Joy! I'm planning an event in ${locality.name}, Gurgaon. Could you share decoration options and availability?`
  );
  const waUrl = `https://wa.me/${cleanWhatsapp || "917015767715"}?text=${waMessage}`;

  return (
    <div className="locality-page">
      <SEO
        title={locality.seoTitle}
        description={locality.seoDescription}
        canonical={`/locations/${locality.slug}`}
        jsonLd={[localBusinessSchema, breadcrumbSchema, faqSchema]}
      />

      {/* ── Breadcrumb Navigation ── */}
      <nav className="locality-breadcrumb" aria-label="Breadcrumbs">
        <div className="locality-container">
          <ol>
            <li>
              <Link to="/">Home</Link>
              <span className="breadcrumb-sep">/</span>
            </li>
            <li>
              <span>Locations</span>
              <span className="breadcrumb-sep">/</span>
            </li>
            <li aria-current="page">
              <strong>{locality.name}</strong>
            </li>
          </ol>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="locality-hero">
        <div className="locality-container">
          <div className="locality-badge">
            <span>⚡ {locality.deliverySLA}</span>
          </div>
          <h1 className="locality-title">{locality.headline}</h1>
          <p className="locality-subtitle">{locality.subtitle}</p>

          <div className="locality-meta-bar">
            <div className="meta-item">
              <span className="meta-label">Pricing</span>
              <span className="meta-value">Custom Quote on WhatsApp</span>
            </div>
            <div className="meta-divider" />
            <div className="meta-item">
              <span className="meta-label">Local Hub</span>
              <span className="meta-value">166GF Sector 57 HQ</span>
            </div>
            <div className="meta-divider" />
            <div className="meta-item">
              <span className="meta-label">Service Rating</span>
              <span className="meta-value">★ 4.9 (150+ Events)</span>
            </div>
          </div>

          <div className="locality-actions">
            <Link to="/shop" className="locality-cta-btn primary">
              Browse Decoration Packages
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="locality-cta-btn whatsapp"
            >
              💬 WhatsApp Us ({locality.name})
            </a>
          </div>
        </div>
      </header>

      {/* ── High-Intent Condominiums & Societies ── */}
      <section className="locality-condos-section">
        <div className="locality-container">
          <div className="section-header">
            <span className="section-eyebrow">Neighborhood Coverage</span>
            <h2>Serving Condos & Gated Societies in {locality.name}</h2>
            <p>Our experienced decoration teams visit these premier societies every week:</p>
          </div>

          <div className="condos-grid">
            {locality.targetCondos.map((condo, idx) => (
              <div key={idx} className="condo-card">
                <span className="condo-icon">📍</span>
                <span className="condo-name">{condo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Highlights ── */}
      <section className="locality-highlights-section">
        <div className="locality-container">
          <div className="section-header">
            <span className="section-eyebrow">Why Residents Choose Us</span>
            <h2>Careful, Society-Compliant Setup</h2>
          </div>

          <div className="highlights-grid">
            {locality.highlights.map((item, idx) => (
              <div key={idx} className="highlight-card">
                <div className="highlight-num">0{idx + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Area Testimonials ── */}
      <section className="locality-reviews-section">
        <div className="locality-container">
          <div className="section-header">
            <span className="section-eyebrow">Verified Local Reviews</span>
            <h2>What Families in {locality.name} Say</h2>
          </div>

          <div className="reviews-grid">
            {locality.testimonials.map((review, idx) => (
              <div key={idx} className="review-card">
                <div className="review-stars">{"★".repeat(review.rating || 5)}</div>
                <p className="review-text">"{review.text}"</p>
                <div className="review-author">
                  <strong>{review.name}</strong>
                  <span className="review-location">{review.condo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Area FAQs ── */}
      <section className="locality-faq-section">
        <div className="locality-container">
          <div className="section-header">
            <span className="section-eyebrow">Frequently Asked Questions</span>
            <h2>Booking Decor in {locality.name}</h2>
          </div>

          <div className="faq-list">
            {locality.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Locality Footer CTA ── */}
      <section className="locality-footer-cta">
        <div className="locality-container">
          <div className="footer-cta-box">
            <h2>Ready to Celebrate in {locality.name}?</h2>
            <p>
              Lock in your preferred date and slot online, or talk to our lead decorator on WhatsApp.
            </p>
            <div className="footer-cta-buttons">
              <Link to="/shop" className="locality-cta-btn primary">
                Explore Packages
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="locality-cta-btn whatsapp"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
