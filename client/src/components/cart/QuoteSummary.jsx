import React from "react";
import styles from "./CartDrawer.module.css";

export function QuoteSummary({ pricing, paymentMode }) {
  return (
    <div className={styles.summaryBox}>
      <div className={styles.summaryRow}>
        <span>Price Estimate</span>
        <span style={{ color: "var(--gold)", fontWeight: 700 }}>Custom Quote on WhatsApp</span>
      </div>

      <div className={styles.summaryRow}>
        <span>Gurugram Delivery & Styling</span>
        <span style={{ color: "var(--success, #059669)", fontWeight: 700 }}>FREE</span>
      </div>

      <div className={styles.summaryRow}>
        <span>Clean Teardown</span>
        <span style={{ color: "var(--success, #059669)", fontWeight: 700 }}>Included</span>
      </div>

      <div className={styles.summaryTotal}>
        <span>Reservation</span>
        <span style={{ color: "var(--gold)", fontWeight: 700 }}>Pay After Confirmation</span>
      </div>

      <div className={styles.advanceBadge}>
        <span>🔒 Zero Payment Required to Reserve Slot</span>
      </div>
    </div>
  );
}

