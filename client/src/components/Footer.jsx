import React, { useState } from "react";
import { Link } from "react-router-dom";
import WhatsAppButton from "./WhatsAppButton";
import { usePublicSettings } from "../context/SettingsContext";
import "../styles/footer.css";

function Footer() {
  const { phone, cleanPhone, business } = usePublicSettings();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState({ state: "idle", message: "" });

  const handleSubscribe = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setNewsletterStatus({
        state: "error",
        message: "Please enter a valid email address (e.g. name@example.com)",
      });
      return;
    }

    setNewsletterStatus({
      state: "success",
      message: "🎉 Subscribed! Use promo code 'WELCOME10' for 10% off your first setup.",
    });
    setEmail("");
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        {/* Newsletter Signup Banner */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "var(--radius-xl)",
            padding: "36px clamp(20px, 4vw, 48px)",
            marginBottom: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div style={{ maxWidth: "520px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "var(--gold)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              VIP Celebration Club
            </span>
            <h3 style={{ color: "#ffffff", fontSize: "1.45rem", fontWeight: 700, margin: "0 0 6px 0" }}>
              Get 10% Off Your First Gurugram Setup
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9rem", margin: 0 }}>
              Subscribe for seasonal decor trends, festival early bird slots, and secret celebration perks.
            </p>
          </div>

          <form onSubmit={handleSubscribe} style={{ flex: "1 1 320px", maxWidth: "440px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (newsletterStatus.state !== "idle") setNewsletterStatus({ state: "idle", message: "" });
                }}
                aria-label="Email address for newsletter"
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  borderRadius: "var(--radius-full)",
                  border: newsletterStatus.state === "error" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                className="btn btn-gold"
                style={{ whiteSpace: "nowrap", padding: "12px 22px" }}
              >
                Join & Save
              </button>
            </div>
            {newsletterStatus.message && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "0.82rem",
                  color: newsletterStatus.state === "error" ? "#f87171" : "#4ade80",
                  fontWeight: 600,
                }}
              >
                {newsletterStatus.message}
              </div>
            )}
          </form>
        </div>

        {/* Footer Main Columns */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="brand-title">
              Decor Joy <span>Gurgaon</span>
            </div>
            <div className="footer-tagline">"Your Celebration. Our Creation."</div>
            <p className="footer-desc">
              Gurugram's premier event and celebration decoration service operating since 2021. Specializing in birthdays, romantic anniversaries, baby showers, and surprise parties with damage-free setup guarantee.
            </p>
            <WhatsAppButton
              text="Instant WhatsApp Chat"
              message="Hello Decor Joy Gurgaon! I would like to inquire about event decorations."
              className="btn btn-whatsapp"
            />
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Decoration Packages</Link></li>
              <li><Link to="/gallery">Photo Gallery</Link></li>
              <li><Link to="/about">About Us & Quality</Link></li>
              <li><Link to="/contact">Book / Contact</Link></li>
            </ul>
          </div>

          {/* Decoration Categories */}
          <div className="footer-col">
            <h4 className="footer-col-title">Celebrations</h4>
            <ul className="footer-links-list">
              <li><Link to="/services?category=Birthdays">Birthday Ring Arches</Link></li>
              <li><Link to="/services?category=Anniversaries">Romantic Terraces & Cabanas</Link></li>
              <li><Link to="/services?category=Baby%20Showers">Baby Showers & Cloud Themes</Link></li>
              <li><Link to="/services?category=Proposals">Marry Me Neon Proposals</Link></li>
              <li><Link to="/services?category=Special%20Celebrations">Haldi & Mehendi Backdrops</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col">
            <h4 className="footer-col-title">Visit & Connect</h4>
            <div className="footer-contact-info">
              <div className="footer-contact-item">
                <span className="footer-contact-icon">📍</span>
                <div>
                  <strong>Address:</strong><br />
                  166GF, Sector 57, Housing Board Colony, Gurugram, Haryana
                </div>
              </div>

              <div className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <div>
                  <strong>Phone:</strong><br />
                  <a href={`tel:${cleanPhone}`} style={{ color: "#ffffff" }}>
                    {phone}
                  </a>
                </div>
              </div>

              <div className="footer-contact-item">
                <span className="footer-contact-icon">✉️</span>
                <div>
                  <strong>Email:</strong><br />
                  <a href={`mailto:${business?.email || 'decorjoygurgaon@gmail.com'}`} style={{ color: "#ffffff" }}>
                    {business?.email || "decorjoygurgaon@gmail.com"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p>© {currentYear} Decor Joy Gurgaon. All Rights Reserved. Serving Gurugram since 2021.</p>
          <div>
            <Link to="/admin/login" className="footer-admin-link">
              Admin Portal 🔒
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
