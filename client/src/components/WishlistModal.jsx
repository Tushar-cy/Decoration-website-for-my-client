import React from "react";
import { useShop } from "../context/ShopContext";
import WhatsAppButton from "./WhatsAppButton";

function WishlistModal() {
  const {
    wishlist,
    toggleWishlist,
    addToCart,
    isWishlistOpen,
    setIsWishlistOpen,
  } = useShop();

  if (!isWishlistOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsWishlistOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 20, 18, 0.65)",
        backdropFilter: "blur(5px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalFadeIn 0.25s ease-out",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-alt)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>❤️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--dark)" }}>
                Saved Celebrations
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                {wishlist.length} {wishlist.length === 1 ? "setup" : "setups"} saved for later
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Close wishlist"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {wishlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-light)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px", opacity: 0.6 }}>🤍</div>
              <h4 style={{ fontSize: "1.1rem", marginBottom: "6px", color: "var(--dark)" }}>
                No saved setups yet
              </h4>
              <p style={{ fontSize: "0.88rem", maxWidth: "340px", margin: "0 auto 20px" }}>
                Click the heart icon on any package to save your favorite themes here.
              </p>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => setIsWishlistOpen(false)}
              >
                Browse Designs 🎈
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {wishlist.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={item.image || item.images?.[0]?.url || "/decor-gallery/decor_001.jpg"}
                    alt={item.title}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "10px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--dark)" }}>
                        {item.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item)}
                        aria-label="Remove from wishlist"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: "4px" }}>
                      {item.category || item.categoryId?.name || "Event Decor"} • {item.color || "Bespoke Palette"}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--gold)" }}>
                        ✓ Custom Quote
                      </span>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn btn-gold"
                          onClick={() => addToCart(item)}
                          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        >
                          Book / Add 🛍️
                        </button>
                        <WhatsAppButton
                          text="Inquire"
                          message={`Hi Decor Joy! I saved the "${item.title}" setup in my wishlist. Can you share availability?`}
                          className="btn btn-whatsapp"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WishlistModal;
