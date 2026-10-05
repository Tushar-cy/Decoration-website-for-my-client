import React from "react";
import { Link } from "react-router-dom";
import WhatsAppButton from "../components/WhatsAppButton";
import { usePublicSettings } from "../context/SettingsContext";
import SEO from "../components/SEO";
import { buildLocalBusinessJsonLd, buildBreadcrumbJsonLd } from "../utils/jsonLd";
import "../styles/about.css";

function About() {
  const { phone, cleanPhone, business } = usePublicSettings();
  const localBusinessSchema = buildLocalBusinessJsonLd(business);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" },
  ]);

  return (
    <div className="about-page">
      <SEO
        title="About Us | Luxury Event & Balloon Decorators in Gurgaon"
        description="Learn about Decor Joy Gurgaon. Operating from 166GF Sector 57 since 2021, styling 1,500+ birthdays, romantic anniversaries, and luxury celebrations."
        canonical="/about"
        jsonLd={[localBusinessSchema, breadcrumbSchema]}
      />
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Our Story</span>
            <h1 className="section-title">About Decor Joy Gurgaon</h1>
            <p className="section-subtitle">
              Turning ordinary rooms and terraces into extraordinary celebration spaces since 2021.
            </p>
            <div className="gold-divider"></div>
          </div>

          {/* Intro Grid */}
          <div className="about-intro-grid">
            <div className="about-image-stack">
              <img
                src="/decor-gallery/decor_006.jpg"
                alt="Decor Joy Gurgaon Story"
                className="about-main-img"
              />
              <div className="about-experience-badge">
                <div className="exp-years">5+</div>
                <div className="exp-text">Years of Joy</div>
              </div>
            </div>

            <div className="about-text-content">
              <h2>Your Celebration. Our Creation.</h2>
              <p className="about-lead">
                "We believe every milestone deserves to be celebrated with beauty, flair, and unforgettable emotion."
              </p>
              <p className="about-paragraph">
                Founded in 2021 in Sector 57, Gurugram, <strong>Decor Joy Gurgaon</strong> began with a simple yet passionate mission: to bring world-class, Pinterest-worthy event decorations right to your home, terrace, banquet, or hotel room without exorbitant price tags.
              </p>
              <p className="about-paragraph">
                From luxury organic balloon garlands and shimmering sequin walls to intimate candlelit cabanas and dreamy baby shower settings, our team of dedicated stylists pours creative passion into every single detail.
              </p>
              <p className="about-paragraph">
                We handle the heavy lifting — concept design, color palette harmony, props delivery, and on-time setup — so that you can relax and cherish the moments that matter most.
              </p>

              <div style={{ marginTop: "28px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link to="/contact" className="btn btn-gold">
                  Book Your Event 📅
                </Link>
                <WhatsAppButton
                  text="Chat With Our Stylist"
                  message="Hello Decor Joy Gurgaon! I'd love to discuss an upcoming celebration."
                />
              </div>
            </div>
          </div>

          {/* Brand Core Values */}
          <div style={{ marginTop: "80px" }}>
            <div className="section-header">
              <span className="section-tagline">Our Pillars</span>
              <h2 className="section-title">Why Gurgaon Chooses Decor Joy</h2>
              <div className="gold-divider"></div>
            </div>

            <div className="values-grid">
              <div className="value-card">
                <div className="value-number">01</div>
                <h3 className="value-title">Bespoke Creativity</h3>
                <p className="value-desc">
                  No cookie-cutter decors. We listen to your vision and customize every color palette, neon sign, and balloon texture to match your personal vibe.
                </p>
              </div>

              <div className="value-card">
                <div className="value-number">02</div>
                <h3 className="value-title">Flawless Punctuality</h3>
                <p className="value-desc">
                  We value your timeline. Our setup crew arrives on time and completes all decoration work well before the first guest or surprise recipient arrives.
                </p>
              </div>

              <div className="value-card">
                <div className="value-number">03</div>
                <h3 className="value-title">Premium Aesthetics</h3>
                <p className="value-desc">
                  We use shiny chrome balloons, high-grade pastels, sparkling LED lights, and clean props that look breathtaking both in person and on camera.
                </p>
              </div>

              <div className="value-card">
                <div className="value-number">04</div>
                <h3 className="value-title">Transparent Pricing</h3>
                <p className="value-desc">
                  Fair, upfront rates with zero last-minute surprises. We offer complete packages that accommodate both cozy gatherings and lavish celebrations.
                </p>
              </div>
            </div>
          </div>

          {/* Location & Contact Summary */}
          <div
            style={{
              background: "var(--cream-light)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "45px 35px",
              marginTop: "70px",
              textAlign: "center",
            }}
          >
            <span className="badge-gold">Gurugram Headquarters</span>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", marginTop: "12px", marginBottom: "10px" }}>
              Based in Sector 57, Gurugram
            </h3>
            <p style={{ color: "var(--text-light)", maxWidth: "650px", margin: "0 auto 24px" }}>
              <strong>Decor Joy Gurgaon:</strong> 166GF, Sector 57, Housing Board Colony, Gurugram, Haryana. Proudly serving DLF, Golf Course Road, Sohna Road, Sushant Lok, and all surrounding areas.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <a href={`tel:${cleanPhone}`} className="btn btn-outline">
                Call {phone}
              </a>
              <WhatsAppButton
                text="WhatsApp Inquiries"
                message="Hi Decor Joy! I'd like to book a decoration in Gurgaon."
              />
            </div>
          </div>
        </div>
      </section>

      <WhatsAppButton isFloating={true} />
    </div>
  );
}

export default About;
