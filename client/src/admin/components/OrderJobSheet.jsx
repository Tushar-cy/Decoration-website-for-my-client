import React from "react";

function OrderJobSheet({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const balanceDuePaise = Math.max(0, (order.totalPaise || 0) - (order.paidAmountPaise || 0));

  return (
    <div className="admin-modal-backdrop" onClick={onClose} style={{ zIndex: 3500 }}>
      <div
        className="admin-modal-card job-sheet-printable"
        style={{ maxWidth: "700px", width: "95%", background: "#ffffff", padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions bar (hidden in print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <button type="button" className="btn-admin-primary" onClick={handlePrint}>
            🖨️ Print Setup Job Sheet
          </button>
          <button type="button" className="btn-action-edit" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Printable Content */}
        <div style={{ border: "2px solid #0f172a", padding: "24px", borderRadius: "8px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: "16px", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                DECOR JOY GURGAON
              </h1>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                On-Site Crew Setup & Execution Sheet
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#b88932" }}>
                #{order.orderNumber}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Status: {order.status?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Logistics & Timing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px", background: "#f8fafc", padding: "14px", borderRadius: "6px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Celebration Date & Slot
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                {new Date(order.date).toLocaleDateString("en-IN", { dateStyle: "full" })}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#b88932" }}>
                Slot: {order.slotKey?.toUpperCase()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Client Details
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                {order.customer?.name}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                📞 {order.customer?.phone}
              </div>
            </div>
          </div>

          {/* Venue Address */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Venue Address
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
              {order.customer?.address || "Address to be confirmed"}
            </div>
            {order.customer?.pincode && (
              <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                PIN: {order.customer.pincode}
              </div>
            )}
            {order.deliveryNotes && (
              <div style={{ marginTop: "6px", fontSize: "0.82rem", background: "#fef3c7", padding: "6px 10px", borderRadius: "4px", color: "#92400e" }}>
                <strong>Access Instructions:</strong> {order.deliveryNotes}
              </div>
            )}
          </div>

          {/* Setup Items Table */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
              Decoration Elements & Add-Ons
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Item</th>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Details / Theme</th>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1", textAlign: "center" }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700 }}>
                      {it.titleSnapshot || "Setup Package"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>
                      {it.variantSelections && Object.keys(it.variantSelections).length > 0 && (
                        <div>Variants: {JSON.stringify(it.variantSelections)}</div>
                      )}
                      {it.addOns && it.addOns.length > 0 && (
                        <div>Add-ons: {it.addOns.map((a) => a.name).join(", ")}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700 }}>
                      {it.quantity || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "6px", marginBottom: "24px" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Order Total: </span>
              <strong>₹{((order.totalPaise || 0) / 100).toLocaleString("en-IN")}</strong>
              <span style={{ margin: "0 8px", color: "#cbd5e1" }}>|</span>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Advance Paid: </span>
              <strong style={{ color: "#16a34a" }}>₹{((order.paidAmountPaise || 0) / 100).toLocaleString("en-IN")}</strong>
            </div>

            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: balanceDuePaise > 0 ? "#dc2626" : "#16a34a" }}>
                {balanceDuePaise > 0
                  ? `COLLECT ON SITE: ₹${(balanceDuePaise / 100).toLocaleString("en-IN")}`
                  : "PAID IN FULL ✓"}
              </span>
            </div>
          </div>

          {/* Crew Sign-off */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Lead Stylist Sign & Time:</div>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginTop: "10px" }} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Customer Handover Sign:</div>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "30px", marginTop: "10px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderJobSheet;
