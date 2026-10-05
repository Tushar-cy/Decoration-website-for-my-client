import React from "react";
import { Link } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";
import { getOptimizedImageUrl, getImageSrcSet } from "../utils/cloudinary";
import "../styles/hero.css";

const HERO_IMAGE_URL = "/decor-gallery/decor_002.jpg";

function Hero() {
  return (
    <section className="hero-section">
      {/* Decorative Blur Circles */}
      <div className="hero-circle-bg hero-circle-1"></div>
      <div className="hero-circle-bg hero-circle-2"></div>

      <div className="container hero-container">
        {/* Left Column: Hero Content */}
        <div className="hero-content">
          <div className="hero-badge-wrap">
            <div className="hero-badge">
              <span className="sparkle">📍</span>
              <span>Premier Event & Party Styling in Gurgaon</span>
            </div>
            <div className="hero-delivery-pill">
              <span>Condo & Home Setups</span>
            </div>
          </div>

          <h1 className="hero-title">
            Luxury Event & Balloon Decorations in <span>Gurgaon</span>
          </h1>

          {/* Occasion Tags: Instantly communicates what we decorate */}
          <div className="hero-occasions-tags">
            <span className="occ-tag">🎂 Birthdays</span>
            <span className="occ-tag">💍 Anniversaries</span>
            <span className="occ-tag">🍼 Baby Showers</span>
            <span className="occ-tag">❤️ Proposals</span>
            <span className="occ-tag">✨ Milestone Parties</span>
          </div>

          <p className="hero-description">
            Bespoke balloon arches, organic garlands, sequin backdrops, and neon styling. 
            We discuss your venue, design the aesthetic, and craft a stunning setup anywhere in Gurugram.
          </p>

          {/* Core Conversion CTAs: WhatsApp Primary + Plan My Event Secondary */}
          <div className="hero-cta-group">
            <WhatsAppButton
              text="WhatsApp Us"
              className="btn btn-whatsapp hero-btn-main"
              message="Hi Decor Joy, I'm planning an event in Gurgaon and would like to discuss decoration setups, themes, and pricing."
            />
            <Link to="/plan-my-event" className="btn btn-gold hero-btn-sub">
              ✨ Plan My Event
            </Link>
            <Link to="/shop" className="hero-catalog-link">
              Browse Showcase Catalogue ➔
            </Link>
          </div>

          {/* Social Proof / Trust Stats */}
          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Events Styled</span>
            </div>
            <div className="hero-stat-item">
              <span className="stat-number">4.9 ★</span>
              <span className="stat-label">Google Rating</span>
            </div>
            <div className="hero-stat-item">
              <span className="stat-number">Damage-Free</span>
              <span className="stat-label">Condo Guaranteed</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Showcase */}
        <div className="hero-media-wrapper">
          <div className="hero-card-main">
            <img
              src={getOptimizedImageUrl(HERO_IMAGE_URL, { width: 800, height: 600, crop: "fill" })}
              srcSet={getImageSrcSet(HERO_IMAGE_URL, [360, 480, 768, 1000])}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt="Decor Joy Gurgaon Luxury Event & Balloon Decoration"
              width="800"
              height="600"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Floating Trust Cards */}
          <div className="hero-floating-card floating-card-1">
            <div className="floating-icon">🎈</div>
            <div>
              <div className="floating-text-primary">Custom Themes</div>
              <div className="floating-text-secondary">Tailored to your space</div>
            </div>
          </div>

          <div className="hero-floating-card floating-card-2">
            <div className="floating-icon">⏱️</div>
            <div>
              <div className="floating-text-primary">On-Time Setup</div>
              <div className="floating-text-secondary">Ready before your guests arrive</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
