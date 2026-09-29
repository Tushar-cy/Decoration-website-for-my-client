import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PurposeForm from "../components/PurposeForm";
import { getActivePurposes } from "../services/api";

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

  useEffect(() => {
    const fetchPurposes = async () => {
      try {
        const res = await getActivePurposes();
        const list = res.data?.data?.purposes || res.data?.purposes || [];
        setPurposes(list);
      } catch (err) {
        console.error("Error fetching purpose forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurposes();
  }, []);

  // Sync with searchParams
  useEffect(() => {
    const p = searchParams.get("purpose");
    if (p) {
      setSelectedPurpose(p);
    }
  }, [searchParams]);

  const handleSelectPurpose = (key) => {
    setSelectedPurpose(key);
    setSearchParams({ purpose: key });
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleBackToChooser = () => {
    setSelectedPurpose("");
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="plan-event-page" style={{ padding: "40px 16px 80px 16px", backgroundColor: "#fafaf8" }}>
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
              }}
            >
              ← Choose a Different Occasion
            </button>
          </div>

          {/* Render Schema-driven Purpose Form */}
          <PurposeForm
            key={selectedPurpose}
            formKey={selectedPurpose}
            onCancel={handleBackToChooser}
          />
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
