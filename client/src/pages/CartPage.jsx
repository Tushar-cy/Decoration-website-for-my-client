import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { usePublicSettings } from "../context/SettingsContext";
import { CartItem } from "../components/cart/CartItem";
import { CouponBox } from "../components/cart/CouponBox";
import { QuoteSummary } from "../components/cart/QuoteSummary";
import { formatPaise } from "../utils/money";
import "../styles/cartPage.css";

export default function CartPage() {
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
    fixItMessage,
  } = useShop();

  const { cleanWhatsapp, paymentMode } = usePublicSettings();

  const totalPaise = pricing?.totalPaise || 0;

  // WhatsApp order link
  const itemsText = (quoteItems || [])
    .map(
      (item) =>
        `• ${item.titleSnapshot} (x${item.quantity}) - ₹${(
          (item.subtotalPaise || 0) / 100
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  const waMsg = `Hi Decor Joy Gurgaon! I'd like to book these event setups:\n${itemsText}\n\nTotal: ${formatPaise(totalPaise)}\nPlease confirm availability!`;
  const waUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(waMsg)}`;

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-empty-wrap">
          <div className="cart-empty-card">
            <div className="empty-icon">🎈</div>
            <h2>Your Celebration Bag is Empty</h2>
            <p>
              Discover bespoke balloon arches, romantic terrace cabanas, and celebration packages crafted for Gurugram homes.
            </p>
            <Link to="/shop" className="btn btn-gold cart-browse-btn">
              Explore Our Collection ➔
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="cart-title">Your Celebration Bag</h1>
          <span className="cart-count-badge">
            {cartCount} {cartCount === 1 ? "setup" : "setups"} selected
          </span>
        </div>

        {fixItMessage && (
          <div className="cart-fixit-alert">
            <span>⚠️</span>
            <div>
              <strong>Action Needed:</strong> {fixItMessage}
            </div>
          </div>
        )}

        <div className="cart-grid">
          {/* Items Column */}
          <div className="cart-items-col">
            <div className="cart-items-list">
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

            <div className="cart-actions-row">
              <Link to="/shop" className="btn btn-outline">
                ← Continue Browsing
              </Link>
            </div>
          </div>

          {/* Summary Column */}
          <div className="cart-summary-col">
            <CouponBox
              couponCode={couponCode}
              couponResult={couponResult}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
            />

            <QuoteSummary pricing={pricing} paymentMode={paymentMode} />

            <div className="cart-checkout-actions">
              <button
                type="button"
                className="btn btn-gold btn-checkout"
                disabled={!!fixItMessage}
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout ({formatPaise(totalPaise)}) ➔
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-wa-order"
              >
                Order & Book via WhatsApp 💬
              </a>
            </div>

            <div className="cart-trust-badges">
              <div className="trust-item">
                <span>🛡️</span>
                <span>100% On-Time Gurugram Delivery Guarantee</span>
              </div>
              <div className="trust-item">
                <span>✨</span>
                <span>Damage-Free Removal & Pro Takedown Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
