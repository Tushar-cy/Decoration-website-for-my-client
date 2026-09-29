import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WhatsAppButton from "../components/WhatsAppButton";
import { createInquiry } from "../services/api";
import "../styles/contact.css";

function Contact() {
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
            {/* Inquiry Form Card */}
            <div className="contact-form-card">
              <h2 className="contact-form-title">Send Booking Inquiry</h2>
              <p className="contact-form-subtitle">
                Fill in your celebration details and we'll get back to you with custom package options within 2 hours.
              </p>

              {successMessage && (
                <div className="form-alert form-alert-success">
                  <strong>Success!</strong> {successMessage}
                  <div style={{ marginTop: "12px" }}>
                    <WhatsAppButton
                      text="Follow up on WhatsApp with event details"
                      message={`Hi Decor Joy Gurgaon! I just submitted an inquiry on your website for ${formData.eventType || "an event"}.`}
                      className="btn btn-whatsapp"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="form-alert form-alert-error">
                  <strong>Notice:</strong> {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">
                      Your Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      placeholder="e.g. Priyanka Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                      Phone / WhatsApp Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      placeholder="e.g. priyanka@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="eventDate">
                      Event Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      className="form-control"
                      value={formData.eventDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="eventType">
                    Occasion / Event Type <span className="required">*</span>
                  </label>
                  <select
                    id="eventType"
                    name="eventType"
                    className="form-control"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Birthday">Birthday Celebration</option>
                    <option value="Anniversary">Romantic Anniversary</option>
                    <option value="Baby Shower">Baby Shower / Welcome Baby</option>
                    <option value="Proposal">Marry Me Proposal</option>
                    <option value="Special Celebrations">Haldi / Ring Ceremony / Pre-Wedding</option>
                    <option value="Kids Party">Kids Themed Birthday</option>
                    <option value="Custom Decor">Other Custom Decoration</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="message">
                    Location & Special Requests (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-control"
                    placeholder="e.g. Terrace setup in DLF Phase 5, pastel pink and gold balloon arch, neon sign needed..."
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ width: "100%", padding: "14px" }}
                  disabled={loading}
                >
                  {loading ? "Submitting Inquiry..." : "Submit Booking Inquiry ✨"}
                </button>
              </form>
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
                  text="Chat +91 7015767715"
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
                      <a href="tel:7015767715">+91 7015767715</a>
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
