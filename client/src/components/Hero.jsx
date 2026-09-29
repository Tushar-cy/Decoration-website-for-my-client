import React from "react";
import { Link } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";
import { getOptimizedImageUrl, getImageSrcSet } from "../utils/cloudinary";
import "../styles/hero.css";

const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80";

function Hero() {
  return (
    <section className="hero-section">
      {/* Decorative Blur Circles */}
      <div className="hero-circle-bg hero-circle-1"></div>
      <div className="hero-circle-bg hero-circle-2"></div>

      <div className="container hero-container">
        {/* Left Column: Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="sparkle">✨</span>
            <span>Gurgaon's Premier Event Stylists Since 2021</span>
          </div>

          <h1 className="hero-title">
            Decor Joy <span>Gurgaon</span>
          </h1>

          <div className="hero-tagline">
            "Your Celebration. Our Creation."
          </div>

          <p className="hero-description">
            Beautifully designed celebrations, thoughtfully decorated to make your special moments unforgettable. From intimate candlelit anniversaries to lavish birthday bashes across Gurugram.
          </p>

          <div className="hero-cta-group">
            <Link to="/shop" className="btn btn-gold">
              Explore Setups 🎈
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Book Your Celebration 📅
            </Link>
            <WhatsAppButton
              text="WhatsApp Us"
              message="Hi Decor Joy Gurgaon! I'd like to plan an event decoration."
            />
          </div>

          {/* Social Proof / Stats */}
          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Events Styled</span>
            </div>
            <div className="hero-stat-item">
              <span className="stat-number">4.9 ★</span>
              <span className="stat-label">Customer Rating</span>
            </div>
            <div className="hero-stat-item">
              <span className="stat-number">Since 2021</span>
              <span className="stat-label">Trusted in Gurgaon</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Showcase (LCP Hero Image with Eager Loading & Explicit Dimensions) */}
        <div className="hero-media-wrapper">
          <div className="hero-card-main">
            <img
              src={getOptimizedImageUrl(HERO_IMAGE_URL, { width: 800, height: 600, crop: "fill" })}
              srcSet={getImageSrcSet(HERO_IMAGE_URL, [360, 480, 768, 1000])}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt="Decor Joy Gurgaon Luxury Event Decoration"
              width="800"
              height="600"
              loading="eager"
              fetchpriority="high"
            />
          </div>

          {/* Floating Trust Cards */}
          <div className="hero-floating-card floating-card-1">
            <div className="floating-icon">🎉</div>
            <div>
              <div className="floating-text-primary">100% Customized</div>
              <div className="floating-text-secondary">Tailored to your theme</div>
            </div>
          </div>

          <div className="hero-floating-card floating-card-2">
            <div className="floating-icon">⏱️</div>
            <div>
              <div className="floating-text-primary">On-Time Setup</div>
              <div className="floating-text-secondary">Hassle-free execution</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
