import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PurposeForm from "../components/PurposeForm";
import { getActivePurposes } from "../services/api";
import SEO from "../components/SEO";
import { buildBreadcrumbJsonLd } from "../utils/jsonLd";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";

const PURPOSE_ICONS = {
  birthday: "🎂",
  anniversary: "💑",
  "baby-shower": "🍼",
  proposal: "💍",
  corporate: "🏢",
  other: "✨",
};

function PlanMyEvent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPurpose = searchParams.get("purpose") || "";

  const [purposes, setPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState(initialPurpose);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurposes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActivePurposes();
      const list = res.data?.data?.purposes || res.data?.purposes || [];
      setPurposes(list);
    } catch (err) {
      console.error("Error fetching purpose forms:", err);
      setError(err.response?.data?.message || err.message || "Failed to load celebration categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurposes();
  }, []);

  const packageSlug = searchParams.get("package") || "";

  // Sync with searchParams & detect package
  useEffect(() => {
    const p = searchParams.get("purpose");
    const pkg = searchParams.get("package");
    if (p) {
      setSelectedPurpose(p);
    } else if (pkg && !selectedPurpose) {
      const lower = pkg.toLowerCase();
      if (lower.includes("birthday") || lower.includes("bday") || lower.includes("kids")) {
        setSelectedPurpose("birthday");
      } else if (lower.includes("anniversary") || lower.includes("romantic")) {
        setSelectedPurpose("anniversary");
      } else if (lower.includes("baby") || lower.includes("shower") || lower.includes("welcome")) {
        setSelectedPurpose("baby-shower");
      } else if (lower.includes("proposal") || lower.includes("marry")) {
        setSelectedPurpose("proposal");
      } else if (lower.includes("corporate") || lower.includes("office")) {
        setSelectedPurpose("corporate");
      }
    }
  }, [searchParams, selectedPurpose]);

  const handleSelectPurpose = (key) => {
    setSelectedPurpose(key);
    setSearchParams(packageSlug ? { purpose: key, package: packageSlug } : { purpose: key });
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleBackToChooser = () => {
    setSelectedPurpose("");
    setSearchParams(packageSlug ? { package: packageSlug } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Plan My Event", url: "/plan-my-event" },
  ]);

  return (
    <div className="plan-event-page" style={{ padding: "40px 16px 80px 16px", backgroundColor: "#fafaf8" }}>
      <SEO
        title="Plan My Event — Custom Celebration Form | Decor Joy Gurgaon"
        description="Share your event details, theme ideas, and venue location in Gurgaon. Our design stylists will send a customized proposal within 2 hours."
        canonical="/plan-my-event"
        jsonLd={breadcrumbSchema}
      />
      {/* Hero Header */}
      <div style={{ maxWidth: "800px", margin: "0 auto 40px auto", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            background: "#fff8e7",
            color: "#b8860b",
            border: "1px solid rgba(212,175,55,0.3)",
            padding: "4px 14px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          ✨ Tailored Event Styling Gurgaon
        </span>
        <h1
          style={{
            fontFamily: "var(--font-heading, 'Playfair Display', serif)",
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            color: "#1a1a1a",
            margin: "0 0 12px 0",
            lineHeight: 1.2,
          }}
        >
          Plan Your Dream Celebration
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.05rem", lineHeight: 1.5, margin: 0 }}>
          Choose your occasion below. Our bespoke decorator engine tailors every detail — balloon color palettes,
          venue sizing, neon wording, and plinth backdrops with instant WhatsApp mockups.
        </p>
      </div>

      {/* Main Content Area */}
      {selectedPurpose ? (
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {/* Back button */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={handleBackToChooser}
              style={{
                background: "none",
                border: "none",
                color: "#b8860b",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 0",
                minHeight: "44px",
              }}
            >
              ← Choose a Different Occasion
            </button>
          </div>

          {/* Package inspiration banner */}
          {packageSlug && (
            <div
              style={{
                backgroundColor: "#fffdf5",
                border: "1px solid rgba(184, 137, 50, 0.35)",
                borderRadius: "10px",
                padding: "10px 16px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.88rem",
                color: "#785312",
              }}
            >
              <span>✨</span>
              <span>
                Consultation tailored for: <strong>{packageSlug.replace(/-/g, " ")}</strong>
              </span>
            </div>
          )}

          {/* Render Schema-driven Purpose Form */}
          <PurposeForm
            key={selectedPurpose}
            formKey={selectedPurpose}
            onCancel={handleBackToChooser}
          />
        </div>
      ) : loading ? (
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <LoadingSkeleton count={6} type="card" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Celebrations"
          message={error}
          onRetry={fetchPurposes}
        />
      ) : purposes.length === 0 ? (
        <div
          style={{
            maxWidth: "600px",
            margin: "40px auto",
            textAlign: "center",
            padding: "40px 20px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎈</div>
          <h3 style={{ fontSize: "1.25rem", color: "#0f172a", marginBottom: "8px" }}>
            Event Forms Updating
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: "20px" }}>
            Our online event planner forms are being refreshed. Message us directly on WhatsApp for instant assistance!
          </p>
          <a
            href="https://wa.me/917015767715?text=Hello%20Decor%20Joy%20Gurgaon!%20I%20would%20like%20to%20plan%20decorations%20for%20an%20event."
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
          >
            <span>💬</span> Message on WhatsApp
          </a>
        </div>
      ) : (
        /* Purpose Chooser Grid */
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.35rem",
              marginBottom: "24px",
              color: "#334155",
              fontWeight: 600,
            }}
          >
            Select Your Celebration Purpose
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {purposes.map((p) => {
              const icon = PURPOSE_ICONS[p.key] || "🎉";
              return (
                <div
                  key={p.key}
                  onClick={() => handleSelectPurpose(p.key)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "28px 24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    border: "1px solid #f1f5f9",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "#d4af37";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(212,175,55,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#f1f5f9";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                  }}
                >
                  <div>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{icon}</div>
                    <h3 style={{ fontSize: "1.25rem", margin: "0 0 8px 0", color: "#0f172a" }}>
                      {p.title}
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.45, margin: 0 }}>
                      {p.description || "Customized decoration setup tailored for your celebration in Gurgaon."}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "14px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                      {p.fieldCount ? `${p.fieldCount} questions` : "Interactive Stepper"}
                    </span>
                    <span style={{ color: "#b8860b", fontWeight: 700, fontSize: "0.95rem" }}>
                      Plan This →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanMyEvent;
