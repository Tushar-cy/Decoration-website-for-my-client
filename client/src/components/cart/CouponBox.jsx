import React, { useState } from "react";
import styles from "./CartDrawer.module.css";
import { formatPaise } from "../../utils/money";

export function CouponBox({ couponCode, couponResult, onApplyCoupon, onRemoveCoupon }) {
  const [inputCode, setInputCode] = useState(couponCode || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onApplyCoupon(inputCode.trim());
    }
  };

  return (
    <div className={styles.couponBox}>
      <form onSubmit={handleSubmit} className={styles.couponForm}>
        <input
          type="text"
          className={styles.couponInput}
          placeholder="Promo code (e.g. WELCOME10)"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />
        <button type="submit" className={styles.couponBtn}>
          Apply
        </button>
      </form>

      {couponResult?.valid && (
        <div className={styles.couponSuccess}>
          <span>✓ Code <strong>{couponResult.code}</strong> applied! You saved {formatPaise(couponResult.discountPaise)}.</span>
          <button
            type="button"
            className={styles.removeCouponBtn}
            onClick={() => {
              setInputCode("");
              onRemoveCoupon();
            }}
          >
            Remove
          </button>
        </div>
      )}

      {couponCode && !couponResult?.valid && (
        <div className={styles.couponError}>
          <span>✕ {couponResult?.message || "Invalid or expired promo code"}</span>
          <button
            type="button"
            className={styles.removeCouponBtn}
            onClick={() => {
              setInputCode("");
              onRemoveCoupon();
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
