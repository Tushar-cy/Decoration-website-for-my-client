import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WhatsAppButton from "../components/WhatsAppButton";
import PurposeForm from "../components/PurposeForm";
import { usePublicSettings } from "../context/SettingsContext";
import { createInquiry } from "../services/api";
import SEO from "../components/SEO";
import { buildLocalBusinessJsonLd, buildBreadcrumbJsonLd } from "../utils/jsonLd";
import "../styles/contact.css";

function Contact() {
  const { phone, cleanPhone, whatsapp, business } = usePublicSettings();
  const localBusinessSchema = buildLocalBusinessJsonLd(business);
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Contact & Booking", url: "/contact" },
  ]);
  const routerLocation = useLocation();
  const searchParams = new URLSearchParams(routerLocation.search);
  const prefilledService = searchParams.get("service") || "";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: prefilledService || "Birthday",
    eventDate: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (prefilledService) {
      setFormData((prev) => ({ ...prev, eventType: prefilledService }));
    }
  }, [prefilledService]);

  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    
    // 10 digit Indian phone validation
    const phoneClean = formData.phone.replace(/[\s\-\+]/g, "");
    if (!phoneClean) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(phoneClean.slice(-10))) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.eventDate) {
      errors.eventDate = "Please choose a celebration date";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validate()) {
      setErrorMessage("Please correct the highlighted fields before submitting.");
      return;
    }

    try {
      setLoading(true);
      const res = await createInquiry(formData);
      setSuccessMessage(
        res.data?.message || "Thank you! Your booking inquiry has been submitted. Our team will contact you within 2 hours."
      );
      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        eventType: "Birthday",
        eventDate: "",
        message: "",
      });
      setValidationErrors({});
    } catch (error) {
      console.error("Submission Error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to submit inquiry. Please reach out directly on WhatsApp."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <SEO
        title="Contact & Book Event Decoration in Gurgaon | Decor Joy"
        description="Book your balloon decoration or celebration setup in Gurgaon. Studio at 166GF Sector 57. WhatsApp +91 7015767715 or submit an inquiry for rapid response."
        canonical="/contact"
        jsonLd={[localBusinessSchema, breadcrumbSchema]}
      />
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Book Your Celebration</span>
            <h1 className="section-title">Get in Touch</h1>
            <p className="section-subtitle">
              Have an upcoming celebration in Gurgaon? Fill out the inquiry form below or send us an instant message on WhatsApp.
            </p>
            <div className="gold-divider"></div>
          </div>

          <div className="contact-layout">
            {/* Schema-Driven Purpose Form Card */}
            <div className="contact-form-card" style={{ padding: "20px 16px" }}>
              <div style={{ marginBottom: "20px" }}>
                <span className="section-tagline" style={{ fontSize: "0.8rem" }}>Schema-Driven Booking</span>
                <h2 className="contact-form-title" style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
                  Plan Your Event Setup
                </h2>
                <p className="contact-form-subtitle" style={{ fontSize: "0.9rem", marginBottom: "16px" }}>
                  Select your occasion to load customized styling questions and get immediate quotes.
                </p>

                {/* Purpose Switcher Tabs */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    { key: "birthday", label: "🎂 Birthday" },
                    { key: "anniversary", label: "💑 Anniversary" },
                    { key: "baby-shower", label: "🍼 Baby Shower" },
                    { key: "proposal", label: "💍 Proposal" },
                    { key: "corporate", label: "🏢 Corporate" },
                    { key: "other", label: "✨ Custom" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, eventType: p.key }))}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        border: "1.5px solid",
                        borderColor: (formData.eventType || "birthday").toLowerCase().includes(p.key) ? "#d4af37" : "#e2e8f0",
                        backgroundColor: (formData.eventType || "birthday").toLowerCase().includes(p.key) ? "#fffdf5" : "#f8fafc",
                        color: (formData.eventType || "birthday").toLowerCase().includes(p.key) ? "#996515" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic PurposeForm */}
              <PurposeForm
                key={formData.eventType || "birthday"}
                formKey={formData.eventType || "birthday"}
              />
            </div>

            {/* Sidebar: Business Info & WhatsApp */}
            <div className="contact-info-sidebar">
              {/* WhatsApp Callout Card */}
              <div className="contact-whatsapp-box">
                <span style={{ fontSize: "2.4rem" }}>💬</span>
                <h3>Instant Chat on WhatsApp</h3>
                <p>
                  Need urgent pricing or same-day decoration setup in Gurgaon? Message our team directly for immediate assistance!
                </p>
                <WhatsAppButton
                  text={`Chat ${whatsapp}`}
                  message="Hello Decor Joy Gurgaon! I need information about event decoration."
                  className="btn"
                  style={{ backgroundColor: "#ffffff", color: "#128c7e", fontWeight: "600" }}
                />
              </div>

              {/* Direct Info Card */}
              <div className="contact-info-card">
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", marginBottom: "20px" }}>
                  Studio & Service Info
                </h3>

                <div className="info-item">
                  <div className="info-icon">📍</div>
                  <div className="info-text">
                    <h4>Location</h4>
                    <p>
                      166GF, Sector 57, Housing Board Colony,<br />
                      Gurugram, Haryana 122003
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">📞</div>
                  <div className="info-text">
                    <h4>Phone Number</h4>
                    <p>
                      <a href={`tel:${cleanPhone}`}>{phone}</a>
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">✉️</div>
                  <div className="info-text">
                    <h4>Email Support</h4>
                    <p>
                      <a href="mailto:decorjoygurgaon@gmail.com">
                        decorjoygurgaon@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">⏱️</div>
                  <div className="info-text">
                    <h4>Operating Hours</h4>
                    <p>
                      Monday - Sunday: 9:00 AM - 10:00 PM<br />
                      (24/7 Setup by prior booking)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppButton isFloating={true} />
    </div>
  );
}

export default Contact;
