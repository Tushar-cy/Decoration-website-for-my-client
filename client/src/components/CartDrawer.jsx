import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { createInquiry } from "../services/api";

const GURGAON_LOCALITIES = [
  "DLF Phase 1 - 5",
  "Golf Course Road",
  "Golf Course Extension",
  "Sohna Road",
  "Nirvana Country",
  "Sector 57 / Sushant Lok",
  "New Gurgaon (Sec 80-95)",
  "Cyber City / Ambience",
  "Other Gurugram Area",
];

const TIME_SLOTS = [
  "Morning (9:00 AM - 12:00 PM)",
  "Afternoon (1:00 PM - 4:00 PM)",
  "Evening (4:30 PM - 7:30 PM)",
  "Midnight Surprise (10:30 PM - 11:45 PM)",
];

function CartDrawer() {
  const {
    cart,
    cartTotal,
    cartCount,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    showToast,
  } = useShop();

  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Items, 2: Checkout
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState("");

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    locality: GURGAON_LOCALITIES[0],
    address: "",
    date: "",
    slot: TIME_SLOTS[2],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    if (promoCode.trim().toUpperCase() === "WELCOME10" || promoCode.trim().toUpperCase() === "DECORJOY") {
      setDiscountPercent(10);
      showToast("Coupon applied! 10% discount added 🎉");
    } else {
      setPromoError("Invalid code. Try 'WELCOME10'");
    }
  };

  const discountAmount = Math.round((cartTotal * discountPercent) / 100);
  const finalTotal = cartTotal - discountAmount;

  // Build WhatsApp Message
  const itemsSummary = cart
    .map((item) => `• ${item.product.title} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString("en-IN")}`)
    .join("\n");

  const waOrderMessage = `Hello Decor Joy Gurgaon! I'd like to book the following celebration order:
${itemsSummary}

• Subtotal: ₹${cartTotal.toLocaleString("en-IN")}
${discountAmount > 0 ? `• Discount (10%): -₹${discountAmount.toLocaleString("en-IN")}\n` : ""}• Final Total: ₹${finalTotal.toLocaleString("en-IN")}
• Celebration Date: ${customerDetails.date || "To be confirmed"}
• Preferred Slot: ${customerDetails.slot}
• Locality: ${customerDetails.locality}
${customerDetails.address ? `• Address: ${customerDetails.address}\n` : ""}• Name: ${customerDetails.name || "Customer"}
• Phone: ${customerDetails.phone || "Provided on chat"}

Please confirm slot availability!`;

  const waOrderUrl = `https://wa.me/917015767715?text=${encodeURIComponent(waOrderMessage)}`;

  const handleSubmitOnline = async (e) => {
    e.preventDefault();
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.date) {
      showToast("Please fill Name, Phone, and Celebration Date", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await createInquiry({
        name: customerDetails.name,
        phone: customerDetails.phone,
        eventType: cart[0]?.product?.category || "Celebration Booking",
        eventDate: customerDetails.date,
        message: `Cart Booking (${cartCount} items, Total: ₹${finalTotal}):\n${itemsSummary}\nLocality: ${customerDetails.locality}`,
      });
      setOrderConfirmed(true);
      clearCart();
      showToast("Booking request sent! Our team will call you shortly.");
    } catch (err) {
      console.error(err);
      showToast("Submission failed, please order via WhatsApp", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setIsCartOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 20, 18, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          background: "var(--white)",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Drawer Header */}
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
            <span style={{ fontSize: "1.3rem" }}>🛍️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--dark)" }}>
                {checkoutStep === 1 ? "Celebration Bag" : "Quick Reservation"}
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
                {cartCount} {cartCount === 1 ? "setup" : "setups"} selected
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {orderConfirmed ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "10px" }}>Booking Request Received!</h3>
              <p style={{ color: "var(--text-light)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Our Gurugram styling coordinator will contact you within 60 minutes to confirm venue timing and design nuances.
              </p>
              <a
                href={waOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ width: "100%", marginBottom: "12px" }}
              >
                Track on WhatsApp 💬
              </a>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setOrderConfirmed(false);
                  setCheckoutStep(1);
                  setIsCartOpen(false);
                }}
                style={{ width: "100%" }}
              >
                Continue Browsing
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 10px", color: "var(--text-light)" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "16px", opacity: 0.7 }}>🎈</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "var(--dark)" }}>Your celebration bag is empty</h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "24px" }}>
                Explore our signature balloon setups, floral cabanas, and neon arches.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCartOpen(false)}
                >
                  Browse Packages
                </button>
                <Link
                  to="/plan-my-event"
                  className="btn btn-gold"
                  onClick={() => setIsCartOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  Plan Custom Event ✨
                </Link>
              </div>
            </div>
          ) : checkoutStep === 1 ? (
            /* STEP 1: ITEM LIST */
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: "14px",
                      padding: "14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--white)",
                    }}
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, margin: 0, color: "var(--dark)" }}>
                          {item.product.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Remove item"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: "0.85rem",
                            padding: "0 4px",
                          }}
                        >
                          🗑️
                        </button>
                      </div>

                      <div style={{ fontSize: "0.76rem", color: "var(--text-light)", marginTop: "4px" }}>
                        Theme: <strong>{item.selectedColor}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                        {/* Quantity Stepper */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-full)",
                            padding: "2px 8px",
                            gap: "8px",
                            fontSize: "0.82rem",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800 }}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800 }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--dark)" }}>
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <form onSubmit={handleApplyPromo} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Promo Code (try WELCOME10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                    }}
                  />
                  <button type="submit" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                    Apply
                  </button>
                </div>
                {promoError && (
                  <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px" }}>{promoError}</div>
                )}
                {discountPercent > 0 && (
                  <div style={{ color: "var(--success)", fontSize: "0.75rem", marginTop: "4px", fontWeight: 600 }}>
                    ✓ 10% Discount applied!
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div
                style={{
                  background: "var(--surface-alt)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "0.88rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-light)" }}>
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-light)" }}>
                  <span>Gurugram Delivery & Takedown</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>FREE (Promo)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-light)" }}>
                  <span>Certified On-Site Stylist</span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>Included</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                    <span>Special Discount (10%)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "8px",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "var(--dark)",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "var(--dark-gold)" }}>₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Bespoke / Custom Purpose Request */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  background: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid #fde047",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#854d0e" }}>
                    Need a Custom Decor Theme?
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#a16207" }}>
                    Bespoke styling for baby showers, proposals & corporate events.
                  </div>
                </div>
                <Link
                  to="/plan-my-event"
                  onClick={() => setIsCartOpen(false)}
                  className="btn btn-gold"
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.78rem",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                  }}
                >
                  Plan Event ✨
                </Link>
              </div>
            </div>
          ) : (
            /* STEP 2: CELEBRATION DETAILS */
            <form onSubmit={handleSubmitOnline} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-light)", marginBottom: "4px" }}>
                Provide your celebration date and venue details to reserve your setup slot.
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Celebration Date *
                </label>
                <input
                  type="date"
                  required
                  value={customerDetails.date}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Preferred Time Slot *
                </label>
                <select
                  value={customerDetails.slot}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, slot: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    background: "var(--white)",
                  }}
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Gurgaon Locality *
                </label>
                <select
                  value={customerDetails.locality}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, locality: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    background: "var(--white)",
                  }}
                >
                  {GURGAON_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Specific Apartment / Tower (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tower B, Flat 802, The Crest"
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {!orderConfirmed && cart.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--white)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {checkoutStep === 1 ? (
              <>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => setCheckoutStep(2)}
                  style={{ width: "100%" }}
                >
                  Proceed to Reserve Slot (₹{finalTotal.toLocaleString("en-IN")}) ➔
                </button>
                <a
                  href={waOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: "100%" }}
                >
                  Order Directly on WhatsApp 💬
                </a>
              </>
            ) : (
              <>
                <a
                  href={waOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ width: "100%" }}
                >
                  Confirm on WhatsApp (Instant Reply) 💬
                </a>
                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={isSubmitting}
                  onClick={handleSubmitOnline}
                  style={{ width: "100%" }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Online Reservation 📝"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCheckoutStep(1)}
                  style={{ width: "100%", padding: "8px" }}
                >
                  ← Back to Bag
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
