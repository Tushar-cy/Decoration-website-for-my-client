import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackOrder } from "../services/api";
import { formatPaise, formatISTDisplay } from "../utils/money";
import { usePublicSettings } from "../context/SettingsContext";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { ErrorState } from "../components/common/ErrorState";
import "../styles/orderTracking.css";

const STATUS_STEPS = [
  { key: "pending", label: "Order Received", icon: "📝" },
  { key: "confirmed", label: "Slot Confirmed", icon: "✓" },
  { key: "in_progress", label: "Stylist Dispatched", icon: "🚚" },
  { key: "completed", label: "Setup Complete", icon: "🎉" },
];

export default function OrderTracking() {
  const { orderNumber } = useParams();
  const { cleanWhatsapp, phone } = usePublicSettings();
  const [phoneFilter, setPhoneFilter] = useState("");

  const {
    data: orderResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order-tracking", orderNumber, phoneFilter],
    queryFn: async () => {
      const res = await trackOrder(orderNumber, phoneFilter || undefined);
      return res.data?.data;
    },
    enabled: !!orderNumber,
    staleTime: 15 * 1000,
    retry: 1,
  });

  const order = orderResult;

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "40px 16px" }}>
        <LoadingSkeleton count={2} type="card" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container" style={{ padding: "40px 16px" }}>
        <ErrorState
          title="Booking Not Found"
          message={
            error?.response?.data?.message ||
            `No booking found for order number "${orderNumber}". Please verify your order number.`
          }
          onRetry={() => refetch()}
        />
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-light)" }}>
            Need help? Contact our styling support team at{" "}
            <a href={`tel:${phone}`} style={{ color: "#c59b27", fontWeight: 700 }}>
              {phone}
            </a>
          </p>
        </div>
      </div>
    );
  }

  const currentStatus = order.status || "pending";
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "cancelled";

  // Add to Google Calendar generator
  const createGoogleCalendarUrl = () => {
    if (!order.event?.date) return "#";
    const cleanDate = order.event.date.replace(/-/g, "");
    const title = encodeURIComponent(`Decor Joy Celebration Setup (${order.orderNumber})`);
    const details = encodeURIComponent(
      `Decor Joy Gurgaon celebration setup.\nSlot: ${order.event.slotKey}\nBooking: ${order.orderNumber}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T090000Z/${cleanDate}T120000Z&details=${details}&location=Gurugram`;
  };

  // WhatsApp Share URL
  const waShareMsg = `Hello! My Decor Joy Gurgaon setup booking reference is ${order.orderNumber} for ${order.event?.date || "my event"}. Status: ${order.status.toUpperCase()}`;
  const waShareUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(waShareMsg)}`;

  return (
    <div className="order-tracking-page">
      <div className="container">
        {/* Header Bar */}
        <div className="tracking-header">
          <div>
            <span className="tracking-badge">Booking Reference</span>
            <h1 className="tracking-title">{order.orderNumber}</h1>
            <p className="tracking-subtitle">
              Placed on {formatISTDisplay(order.createdAt || new Date())}
            </p>
          </div>

          <div className="tracking-actions">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              Share on WhatsApp 💬
            </a>
            <a
              href={createGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              📅 Add to Calendar
            </a>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="tracking-card">
          <h2 className="card-heading">Setup Status</h2>

          {isCancelled ? (
            <div className="cancelled-banner">
              <span>✕</span> This booking has been cancelled. If a refund is applicable, it will be processed to your original payment method.
            </div>
          ) : (
            <div className="stepper-wrap">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.key} className={`step-node ${isPassed ? "completed" : ""} ${isCurrent ? "active" : ""}`}>
                    <div className="step-circle">{step.icon}</div>
                    <span className="step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grid: Event Details & Items */}
        <div className="tracking-grid">
          {/* Left: Event & Items */}
          <div className="tracking-left-col">
            <div className="tracking-card">
              <h2 className="card-heading">Celebration & Venue Details</h2>
              <div className="info-grid">
                <div className="info-block">
                  <span className="info-lbl">Event Date</span>
                  <span className="info-val">{formatISTDisplay(order.event?.date)}</span>
                </div>
                <div className="info-block">
                  <span className="info-lbl">Setup Time Slot</span>
                  <span className="info-val">{order.event?.slotKey?.toUpperCase() || "Scheduled"}</span>
                </div>
                <div className="info-block">
                  <span className="info-lbl">Celebration Type</span>
                  <span className="info-val">{order.event?.type || "Celebration"}</span>
                </div>
              </div>
            </div>

            <div className="tracking-card">
              <h2 className="card-heading">Reserved Setups</h2>
              <div className="items-list">
                {(order.items || []).map((it, idx) => (
                  <div key={idx} className="order-item-row">
                    <div className="item-main">
                      <h4>{it.titleSnapshot}</h4>
                      {(it.variantSelections || []).map((v, vIdx) => (
                        <span key={vIdx} className="item-variant">
                          {v.name}: {v.optionLabel}
                        </span>
                      ))}
                    </div>
                    <span className="item-qty">Qty: {it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Payment Overview */}
          <div className="tracking-right-col">
            <div className="tracking-card">
              <h2 className="card-heading">Payment Overview</h2>

              <div className="payment-rows">
                <div className="p-row">
                  <span>Subtotal</span>
                  <span>{formatPaise(order.pricing?.subtotalPaise)}</span>
                </div>
                {order.pricing?.discountPaise > 0 && (
                  <div className="p-row discount">
                    <span>Discount</span>
                    <span>- {formatPaise(order.pricing.discountPaise)}</span>
                  </div>
                )}
                <div className="p-row">
                  <span>Delivery & Styling</span>
                  <span>
                    {order.pricing?.deliveryFeePaise > 0
                      ? formatPaise(order.pricing.deliveryFeePaise)
                      : "FREE"}
                  </span>
                </div>
                <div className="p-row total">
                  <span>Total Amount</span>
                  <span>{formatPaise(order.pricing?.totalPaise)}</span>
                </div>

                <div className="payment-status-badge">
                  <span>Payment Status:</span>
                  <strong className={order.payment?.status === "paid" ? "status-paid" : "status-pending"}>
                    {order.payment?.status?.toUpperCase()}
                  </strong>
                </div>

                {order.payment?.paidPaise > 0 && (
                  <div className="p-row">
                    <span>Advance Received</span>
                    <span style={{ color: "#15803d", fontWeight: 700 }}>
                      {formatPaise(order.payment.paidPaise)}
                    </span>
                  </div>
                )}

                {order.pricing?.totalPaise > (order.payment?.paidPaise || 0) && (
                  <div className="p-row balance">
                    <span>Balance Due on Setup</span>
                    <span>
                      {formatPaise(order.pricing.totalPaise - (order.payment?.paidPaise || 0))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="tracking-help-card">
              <h3>Need Setup Assistance?</h3>
              <p>
                Our Gurugram stylist coordinator is available on WhatsApp and call for any design adjustments.
              </p>
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Chat with Coordinator 💬
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
