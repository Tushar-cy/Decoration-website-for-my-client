import React from "react";
import styles from "./CartDrawer.module.css";
import { formatPaise, formatISTDisplay } from "../../utils/money";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

export function CartItem({ item, quoteItem, onUpdateQuantity, onRemove }) {
  const displayTitle = quoteItem?.titleSnapshot || "Event Decoration Setup";
  const unitPricePaise = quoteItem?.unitPricePaise || 0;
  const subtotalPaise = quoteItem?.subtotalPaise || unitPricePaise * item.quantity;
  const imageUrl = quoteItem?.image || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=300&q=80";

  return (
    <div className={styles.cartItem}>
      <img
        src={getOptimizedImageUrl(imageUrl, { width: 150, height: 150 })}
        alt={displayTitle}
        className={styles.itemImage}
        loading="lazy"
        width="76"
        height="76"
      />
      <div className={styles.itemInfo}>
        <div className={styles.itemHeader}>
          <h4 className={styles.itemTitle}>{displayTitle}</h4>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${displayTitle}`}
          >
            ✕
          </button>
        </div>

        {/* Variants, Addons, Slot and Date pills */}
        <div className={styles.itemBadges}>
          {item.date && (
            <span className={styles.badge}>
              📅 {formatISTDisplay(item.date)}
            </span>
          )}
          {item.slotKey && (
            <span className={styles.badge}>
              ⏰ {item.slotKey.toUpperCase()}
            </span>
          )}
          {(item.variantSelections || []).map((v, idx) => (
            <span key={idx} className={styles.badge}>
              {v.name}: {v.optionLabel}
            </span>
          ))}
          {(quoteItem?.addOns || []).map((a, idx) => (
            <span key={idx} className={styles.badge}>
              + {a.name} ({formatPaise(a.pricePaise)})
            </span>
          ))}
        </div>

        <div className={styles.itemFooter}>
          {/* Stepper with >= 44px touch targets */}
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => onUpdateQuantity(item.id, -1)}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className={styles.stepQty}>{item.quantity}</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => onUpdateQuantity(item.id, 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div className={styles.itemPrice}>
            {formatPaise(subtotalPaise)}
          </div>
        </div>
      </div>
    </div>
  );
}
