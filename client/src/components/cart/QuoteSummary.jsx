import React from "react";
import styles from "./CartDrawer.module.css";
import { formatPaise } from "../../utils/money";

export function QuoteSummary({ pricing, paymentMode }) {
  const {
    subtotalPaise = 0,
    discountPaise = 0,
    deliveryFeePaise = 0,
    totalPaise = 0,
    advanceDuePaise = 0,
    advancePercent = 25,
  } = pricing || {};

  return (
    <div className={styles.summaryBox}>
      <div className={styles.summaryRow}>
        <span>Subtotal</span>
        <span>{formatPaise(subtotalPaise)}</span>
      </div>

      {discountPaise > 0 && (
        <div className={styles.summaryRowDiscount}>
          <span>Coupon Discount</span>
          <span>- {formatPaise(discountPaise)}</span>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span>Gurugram Delivery & Styling</span>
        <span>{deliveryFeePaise > 0 ? formatPaise(deliveryFeePaise) : "FREE"}</span>
      </div>

      <div className={styles.summaryTotal}>
        <span>Order Total</span>
        <span>{formatPaise(totalPaise)}</span>
      </div>

      {paymentMode === "advance_online" && advanceDuePaise > 0 && (
        <div className={styles.advanceBadge}>
          <span>Advance to book ({advancePercent}%):</span>
          <span>{formatPaise(advanceDuePaise)}</span>
        </div>
      )}
      {paymentMode === "pay_on_confirmation" && (
        <div className={styles.advanceBadge}>
          <span>Payment Mode:</span>
          <span>Pay on Confirmation</span>
        </div>
      )}
    </div>
  );
}
