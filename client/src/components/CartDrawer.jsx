import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./cart/CartDrawer.module.css";
import { useShop } from "../context/ShopContext";
import { usePublicSettings } from "../context/SettingsContext";
import { CartItem } from "./cart/CartItem";
import { CouponBox } from "./cart/CouponBox";
import { QuoteSummary } from "./cart/QuoteSummary";
import { CheckoutForm } from "./cart/CheckoutForm";
import { createOrder } from "../services/api";

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    quoteItems,
    pricing,
    couponResult,
    couponCode,
    applyCoupon,
    removeCoupon,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    showToast,
    fixItMessage,
  } = useShop();

  const { cleanWhatsapp, phone, paymentMode } = usePublicSettings();

  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Bag items, 2: Checkout details
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "122001",
    date: "",
    slotKey: "evening",
    notes: "",
  });

  if (!isCartOpen) return null;

  // Build WhatsApp inquiry link using dynamic phone from public settings
  const itemsText = (quoteItems || [])
    .map(
      (item) =>
        `• ${item.titleSnapshot} (x${item.quantity}) - ₹${(
          (item.subtotalPaise || 0) / 100
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  const totalRupees = Math.round((pricing?.totalPaise || 0) / 100).toLocaleString("en-IN");
  const waMessage = `Hi Decor Joy Gurgaon! I would like to book the following celebration setups:
${itemsText}

Total: ₹${totalRupees}
Pincode: ${formState.pincode}
Preferred Date: ${formState.date || "To be confirmed"}
Preferred Slot: ${formState.slotKey}

Could you please confirm slot availability?`;

  const waUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(waMessage)}`;

  // Handle direct checkout creation
  const handleQuickCheckout = async (e) => {
    if (e) e.preventDefault();
    if (!formState.name || !formState.phone || !formState.date || !formState.slotKey) {
      showToast("Please fill in Name, Phone, Date, and Time Slot", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        customer: {
          name: formState.name.trim(),
          phone: formState.phone.trim(),
          email: "",
        },
        event: {
          type: "Birthday",
          date: formState.date,
          slotKey: formState.slotKey,
          address: {
            line1: formState.address.trim(),
            locality: "Gurgaon",
            city: "Gurugram",
            pincode: formState.pincode.trim(),
          },
          notes: formState.notes,
        },
        items: cart.map((item) => ({
          productId: item.productId,
          variantSelections: item.variantSelections,
          addOnIds: item.addOnIds,
          quantity: item.quantity,
        })),
        couponCode: couponCode || null,
        pincode: formState.pincode,
        source: "web",
      };

      const res = await createOrder(orderPayload, idempotencyKey);
      const createdOrder = res.data?.data;

      clearCart();
      setIsCartOpen(false);
      showToast("Order initiated successfully! Redirecting to tracking...");
      navigate(`/order/${createdOrder.orderNumber}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to create order. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={() => setIsCartOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Celebration Bag"
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <span className={styles.headerIcon}>🛍️</span>
            <div>
              <h3 className={styles.title}>
                {checkoutStep === 1 ? "Celebration Bag" : "Booking Details"}
              </h3>
              <span className={styles.subtitle}>
                {cartCount} {cartCount === 1 ? "setup" : "setups"} in bag
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsCartOpen(false)}
            aria-label="Close bag"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {fixItMessage && (
            <div className={styles.fixItNotice}>
              <span>⚠️</span>
              <div>
                <strong>Action Needed:</strong> {fixItMessage}
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎈</div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--dark)" }}>Your celebration bag is empty</h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
                Browse our bespoke ring arches, candle cabanas, and celebration packages.
              </p>
              <Link
                to="/shop"
                className={styles.primaryBtn}
                onClick={() => setIsCartOpen(false)}
              >
                Explore Shop
              </Link>
            </div>
          ) : checkoutStep === 1 ? (
            <>
              {/* Items List */}
              <div className={styles.itemsList}>
                {cart.map((cartItem) => {
                  const qItem = quoteItems.find((qi) => qi.productId === cartItem.productId);
                  return (
                    <CartItem
                      key={cartItem.id}
                      item={cartItem}
                      quoteItem={qItem}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  );
                })}
              </div>

              {/* Promo Code */}
              <CouponBox
                couponCode={couponCode}
                couponResult={couponResult}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
              />

              {/* Quote Breakdown */}
              <QuoteSummary pricing={pricing} paymentMode={paymentMode} />
            </>
          ) : (
            <CheckoutForm
              formState={formState}
              onChange={setFormState}
              onSubmit={handleQuickCheckout}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className={styles.footer}>
            {checkoutStep === 1 ? (
              <>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!!fixItMessage}
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/checkout");
                  }}
                >
                  Proceed to Checkout (₹{totalRupees}) ➔
                </button>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappBtn}
                >
                  Chat & Book on WhatsApp 💬
                </a>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={isSubmitting || !!fixItMessage}
                  onClick={handleQuickCheckout}
                >
                  {isSubmitting ? "Creating Order..." : "Confirm & Pay ➔"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setCheckoutStep(1)}
                >
                  ← Back to Items
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
