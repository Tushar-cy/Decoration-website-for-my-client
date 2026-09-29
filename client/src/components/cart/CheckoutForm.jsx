import React from "react";
import styles from "./CartDrawer.module.css";
import { usePublicSettings } from "../../context/SettingsContext";

export function CheckoutForm({ formState, onChange, onSubmit, isSubmitting }) {
  const { slots, serviceablePincodes } = usePublicSettings();

  const handleFieldChange = (field, value) => {
    onChange({ ...formState, [field]: value });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Your Name *</label>
        <input
          type="text"
          className={styles.input}
          required
          autoComplete="name"
          enterKeyHint="next"
          placeholder="e.g. Priyanshi Verma"
          value={formState.name || ""}
          onChange={(e) => handleFieldChange("name", e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Phone Number (WhatsApp) *</label>
        <input
          type="tel"
          className={styles.input}
          required
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="e.g. 9876543210"
          value={formState.phone || ""}
          onChange={(e) => handleFieldChange("phone", e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Event Date *</label>
        <input
          type="date"
          className={styles.input}
          required
          enterKeyHint="next"
          min={new Date().toISOString().split("T")[0]}
          value={formState.date || ""}
          onChange={(e) => handleFieldChange("date", e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Time Slot *</label>
        <select
          className={styles.select}
          required
          value={formState.slotKey || ""}
          onChange={(e) => handleFieldChange("slotKey", e.target.value)}
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

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Gurugram Pincode *</label>
        <select
          className={styles.select}
          required
          autoComplete="postal-code"
          value={formState.pincode || ""}
          onChange={(e) => handleFieldChange("pincode", e.target.value)}
        >
          <option value="">Select pincode</option>
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

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Venue Address / Apartment *</label>
        <input
          type="text"
          className={styles.input}
          required
          autoComplete="street-address"
          enterKeyHint="next"
          placeholder="e.g. Tower 3, Flat 902, The Crest, DLF 5"
          value={formState.address || ""}
          onChange={(e) => handleFieldChange("address", e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Special Styling Notes (Optional)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. Preferred balloon colours, celebrant name for signage"
          value={formState.notes || ""}
          onChange={(e) => handleFieldChange("notes", e.target.value)}
        />
      </div>
    </form>
  );
}
