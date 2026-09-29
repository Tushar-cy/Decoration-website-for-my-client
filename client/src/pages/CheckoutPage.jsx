import React, { useState, useId, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { usePublicSettings } from "../context/SettingsContext";
import { createOrder, verifyPayment } from "../services/api";
import { QuoteSummary } from "../components/cart/QuoteSummary";
import { formatPaise } from "../utils/money";
import "../styles/checkoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    quoteItems,
    pricing,
    couponCode,
    clearCart,
    showToast,
    fixItMessage,
  } = useShop();

  const { slots, serviceablePincodes, paymentMode } = usePublicSettings();

  // Stable idempotency key generated once per checkout attempt
  const idempotencyKeyRef = useRef(`idem_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    addressLine: "",
    pincode: "122001",
    date: cart[0]?.date || "",
    slotKey: cart[0]?.slotKey || "evening",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Dynamically load Razorpay SDK if not already in window
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (cart.length === 0) {
      showToast("Your celebration bag is empty", "error");
      navigate("/shop");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.date || !formData.slotKey || !formData.addressLine.trim()) {
      setErrorMessage("Please complete all required fields (Name, Phone, Date, Slot, and Address).");
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        },
        event: {
          type: "Birthday",
          date: formData.date,
          slotKey: formData.slotKey,
          address: {
            line1: formData.addressLine.trim(),
            locality: "Gurgaon",
            city: "Gurugram",
            pincode: formData.pincode.trim(),
          },
          notes: formData.notes.trim(),
        },
        items: cart.map((item) => ({
          productId: item.productId,
          variantSelections: item.variantSelections,
          addOnIds: item.addOnIds,
          quantity: item.quantity,
        })),
        couponCode: couponCode || null,
        pincode: formData.pincode,
        source: "web",
      };

      const res = await createOrder(orderPayload, idempotencyKeyRef.current);
      const orderData = res.data?.data;

      if (!orderData) {
        throw new Error("Unable to create order. Please try again.");
      }

      // Check if online advance payment with Razorpay is required
      if (orderData.razorpayOrderId && orderData.amount > 0) {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !window.Razorpay) {
          // Fallback if Razorpay fails to load: still proceed to order tracking
          showToast("Payment window could not load. You can pay on confirmation.", "info");
          clearCart();
          navigate(`/order/${orderData.orderNumber}`);
          return;
        }

        const rzpOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: "INR",
          name: "Decor Joy Gurgaon",
          description: `Advance for Order ${orderData.orderNumber}`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: formData.email,
          },
          theme: {
            color: "#c59b27",
          },
          handler: async (paymentResponse) => {
            try {
              await verifyPayment({
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              });
              showToast("Payment successful! Slot confirmed 🎉");
            } catch (vErr) {
              console.error("Payment verification warning:", vErr);
            }
            clearCart();
            navigate(`/order/${orderData.orderNumber}`);
          },
          modal: {
            ondismiss: () => {
              showToast("Payment cancelled or closed. Your booking is pending confirmation.", "info");
              clearCart();
              navigate(`/order/${orderData.orderNumber}`);
            },
          },
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.on("payment.failed", (failedRes) => {
          showToast(`Payment failed: ${failedRes.error?.description || "Transaction declined"}`, "error");
          clearCart();
          navigate(`/order/${orderData.orderNumber}`);
        });
        rzp.open();
      } else {
        // Pay-on-confirmation path
        showToast("Order placed successfully! Pay on confirmation 🎉");
        clearCart();
        navigate(`/order/${orderData.orderNumber}`);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Something went wrong while placing your order.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h2>Your bag is empty</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "20px" }}>Add setups before checking out.</p>
          <Link to="/shop" className="btn btn-gold">
            Browse Setups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Link to="/cart" className="checkout-back-link">
            ← Back to Bag
          </Link>
          <h1 className="checkout-title">Reserve Setup & Checkout</h1>
          <p className="checkout-subtitle">
            Provide event venue details to reserve your setup slot.
          </p>
        </div>

        {fixItMessage && (
          <div className="checkout-alert">
            <span>⚠️</span>
            <div>
              <strong>Action Needed:</strong> {fixItMessage}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="checkout-alert">
            <span>✕</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <div className="checkout-grid">
          {/* Form Column */}
          <div className="checkout-form-col">
            <form onSubmit={handleSubmitOrder} className="checkout-form-card">
              <h2 className="section-heading">1. Customer Contact</h2>

              <div className="form-group">
                <label className="input-label">Full Name *</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  enterKeyHint="next"
                  placeholder="e.g. Radhika Sharma"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="e.g. 9876543210"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="next"
                    placeholder="e.g. radhika@gmail.com"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <h2 className="section-heading" style={{ marginTop: "24px" }}>
                2. Event Schedule & Venue
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Celebration Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Setup Time Slot *</label>
                  <select
                    required
                    className="form-control"
                    value={formData.slotKey}
                    onChange={(e) => handleChange("slotKey", e.target.value)}
                  >
                    <option value="">Select a slot</option>
                    {slots.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                    {slots.length === 0 && (
                      <>
                        <option value="morning">Morning (09:00 - 12:00)</option>
                        <option value="afternoon">Afternoon (13:00 - 16:00)</option>
                        <option value="evening">Evening (16:30 - 19:30)</option>
                        <option value="midnight">Midnight Surprise (22:30 - 23:45)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">Gurugram Pincode *</label>
                  <select
                    required
                    autoComplete="postal-code"
                    className="form-control"
                    value={formData.pincode}
                    onChange={(e) => handleChange("pincode", e.target.value)}
                  >
                    {serviceablePincodes.map((p) => (
                      <option key={p.pincode} value={p.pincode}>
                        {p.pincode}
                      </option>
                    ))}
                    {serviceablePincodes.length === 0 && (
                      <>
                        <option value="122001">122001 (Old Gurgaon)</option>
                        <option value="122002">122002 (DLF Phase 1-2)</option>
                        <option value="122003">122003 (Sushant Lok)</option>
                        <option value="122011">122011 (Golf Course Road / DLF 5)</option>
                        <option value="122018">122018 (Sohna Road)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Address / Tower / Apartment *</label>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  enterKeyHint="next"
                  placeholder="e.g. Tower B, Flat 802, The Crest, DLF Phase 5"
                  className="form-control"
                  value={formData.addressLine}
                  onChange={(e) => handleChange("addressLine", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Special Decor Instructions / Neon Sign Text (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Neon text 'Happy 30th Rohan', preferred balloon shades (Rose gold & chrome)"
                  className="form-control"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-gold btn-place-order"
                disabled={isSubmitting || !!fixItMessage}
              >
                {isSubmitting
                  ? "Processing Reservation..."
                  : paymentMode === "advance_online"
                  ? `Pay Advance to Reserve Slot (${formatPaise(pricing?.advanceDuePaise || 0)}) ➔`
                  : "Confirm Reservation (Pay on Confirmation) ➔"}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary-col">
            <div className="checkout-summary-card">
              <h3 className="summary-title">Order Overview</h3>

              <div className="checkout-items-preview">
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="preview-item">
                    <div className="preview-item-info">
                      <span className="preview-title">{item.titleSnapshot}</span>
                      <span className="preview-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="preview-price">{formatPaise(item.subtotalPaise)}</span>
                  </div>
                ))}
              </div>

              <QuoteSummary pricing={pricing} paymentMode={paymentMode} />

              <div className="checkout-guarantees">
                <p>✓ 100% On-Time Stylist Arrival Guarantee</p>
                <p>✓ Clean, Damage-Free Removable Adhesives</p>
                <p>✓ Dedicated Gurugram Stylist Coordination</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
