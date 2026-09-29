import React from "react";

export function LoadingSkeleton({ count = 4, type = "card" }) {
  if (type === "card") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px", width: "100%" }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #ede8e1",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              animation: "pulse 1.5s infinite ease-in-out",
            }}
          >
            <div style={{ height: "220px", background: "#f0ebe1" }} />
            <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ height: "18px", width: "70%", background: "#f0ebe1", borderRadius: "4px" }} />
              <div style={{ height: "14px", width: "90%", background: "#f0ebe1", borderRadius: "4px" }} />
              <div style={{ height: "24px", width: "40%", background: "#f0ebe1", borderRadius: "4px", marginTop: "8px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", animation: "pulse 1.5s infinite ease-in-out" }}>
      <div style={{ height: "24px", width: "60%", background: "#f0ebe1", borderRadius: "4px", marginBottom: "12px" }} />
      <div style={{ height: "16px", width: "100%", background: "#f0ebe1", borderRadius: "4px", marginBottom: "8px" }} />
      <div style={{ height: "16px", width: "80%", background: "#f0ebe1", borderRadius: "4px" }} />
    </div>
  );
}
