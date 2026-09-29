import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
  updateAdminOrderDetails,
  refundAdminOrder,
} from "../services/api";
import OrderJobSheet from "./components/OrderJobSheet";

const ORDER_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

function OrdersManager({ currentUser }) {
  const queryClient = useQueryClient();
  const isOwner = currentUser?.role === "owner";

  // View state: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Active Order Detail Drawer
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [jobSheetOrder, setJobSheetOrder] = useState(null);

  // Reschedule & Refund state
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [refundAmountPaise, setRefundAmountPaise] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [adminNoteText, setAdminNoteText] = useState("");

  // TanStack Query: Orders List
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["adminOrders", page, statusFilter, searchQuery],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      };
      const res = await getAdminOrders(params);
      return res.data?.data;
    },
    staleTime: 15000,
  });

  // Query: Selected Order for Drawer
  const { data: activeOrderData, isLoading: detailLoading } = useQuery({
    queryKey: ["adminOrder", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const res = await getAdminOrder(selectedOrderId);
      return res.data?.data?.order;
    },
    enabled: Boolean(selectedOrderId),
  });

  // Mutation: Update Status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateAdminOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminOrder", selectedOrderId] });
    },
  });

  // Mutation: Update Details (Reschedule, Notes)
  const detailsMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminOrderDetails(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminOrder", selectedOrderId] });
      alert("Order updated successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || "Failed to update order.");
    },
  });

  // Mutation: Refund (Owner only)
  const refundMutation = useMutation({
    mutationFn: ({ id, data }) => refundAdminOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminOrder", selectedOrderId] });
      alert("Refund initiated successfully!");
      setRefundAmountPaise("");
      setRefundReason("");
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || "Refund failed.");
    },
  });

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || { page: 1, totalPages: 1, total: 0 };
  const activeOrder = activeOrderData;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleAddNote = () => {
    if (!adminNoteText.trim() || !activeOrder) return;
    const existing = activeOrder.deliveryNotes || "";
    const updatedNotes = existing ? `${existing} | Note: ${adminNoteText.trim()}` : adminNoteText.trim();
    detailsMutation.mutate({ id: activeOrder._id, data: { deliveryNotes: updatedNotes } });
    setAdminNoteText("");
  };

  const handleReschedule = () => {
    if (!rescheduleDate || !rescheduleSlot || !activeOrder) return;
    detailsMutation.mutate({
      id: activeOrder._id,
      data: { date: rescheduleDate, slotKey: rescheduleSlot },
    });
  };

  const handleRefundSubmit = (e) => {
    e.preventDefault();
    if (!activeOrder || !refundAmountPaise) return;
    const amountInt = parseInt(refundAmountPaise, 10);
    if (isNaN(amountInt) || amountInt <= 0) {
      alert("Please enter a valid refund amount in paise");
      return;
    }
    if (window.confirm(`Issue refund of ₹${(amountInt / 100).toFixed(2)} to customer?`)) {
      refundMutation.mutate({
        id: activeOrder._id,
        data: { amountPaise: amountInt, reason: refundReason },
      });
    }
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Orders & Celebrations</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Track bookings, crew schedules, advance payments, and customer deliveries.
          </p>
        </div>

        {/* View Toggle (Table / Kanban) */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className={`btn-action-edit ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            style={{ background: viewMode === "table" ? "#0f172a" : "#ffffff", color: viewMode === "table" ? "#ffffff" : "#475569" }}
          >
            📋 Table View
          </button>
          <button
            type="button"
            className={`btn-action-edit ${viewMode === "kanban" ? "active" : ""}`}
            onClick={() => setViewMode("kanban")}
            style={{ background: viewMode === "kanban" ? "#0f172a" : "#ffffff", color: viewMode === "kanban" ? "#ffffff" : "#475569" }}
          >
            📊 Kanban Board
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", ...ORDER_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: statusFilter === st ? "#0f172a" : "#ffffff",
                color: statusFilter === st ? "#ffffff" : "#475569",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="fb-input"
            style={{ width: "220px", padding: "6px 10px" }}
            placeholder="Search order#, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-admin-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
            Search
          </button>
        </form>
      </div>

      {/* VIEW MODE: TABLE (Desktop) & CARDS (Mobile) */}
      {viewMode === "table" ? (
        <div className="admin-table-card">
          {isLoading ? (
            <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No orders matching current filter.</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="admin-table desktop-only-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Customer</th>
                    <th>Date & Slot</th>
                    <th>Total & Paid</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => {
                    const balancePaise = (ord.totalPaise || 0) - (ord.paidAmountPaise || 0);
                    return (
                      <tr key={ord._id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(ord._id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <strong style={{ color: "#b88932", textDecoration: "underline" }}>
                              #{ord.orderNumber}
                            </strong>
                          </button>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </td>

                        <td>
                          <strong>{ord.customer?.name}</strong>
                          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>📞 {ord.customer?.phone}</div>
                        </td>

                        <td>
                          <div>{new Date(ord.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                          <div style={{ fontSize: "0.75rem", color: "#b88932", fontWeight: 700 }}>
                            {ord.slotKey?.toUpperCase()}
                          </div>
                        </td>

                        <td>
                          <strong>₹{((ord.totalPaise || 0) / 100).toLocaleString("en-IN")}</strong>
                          <div style={{ fontSize: "0.78rem", color: balancePaise === 0 ? "#16a34a" : "#ea580c" }}>
                            {balancePaise === 0 ? "Fully Paid" : `Bal: ₹${(balancePaise / 100).toLocaleString("en-IN")}`}
                          </div>
                        </td>

                        <td>
                          <select
                            value={ord.status}
                            onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                            className={`status-pill status-${ord.status}`}
                            style={{ border: "1px solid #cbd5e1", outline: "none", cursor: "pointer" }}
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <span
                            className="status-pill"
                            style={{
                              background: ord.paymentStatus === "paid" ? "#dcfce7" : "#fee2e2",
                              color: ord.paymentStatus === "paid" ? "#166534" : "#991b1b",
                            }}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn-action-edit"
                              style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                              onClick={() => setSelectedOrderId(ord._id)}
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              className="btn-action-edit"
                              style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                              onClick={() => setJobSheetOrder(ord)}
                              title="Print Job Sheet for Crew"
                            >
                              🖨️ Job Sheet
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Card List View (under 768px) */}
              <div className="mobile-card-list">
                {orders.map((ord) => (
                  <div
                    key={ord._id}
                    className="fb-card"
                    style={{ marginBottom: "12px", padding: "16px" }}
                    onClick={() => setSelectedOrderId(ord._id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#b88932" }}>#{ord.orderNumber}</strong>
                      <span className={`status-pill status-${ord.status}`}>{ord.status}</span>
                    </div>

                    <div style={{ margin: "8px 0" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{ord.customer?.name}</div>
                      <div style={{ fontSize: "0.82rem", color: "#64748b" }}>📞 {ord.customer?.phone}</div>
                      <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "2px" }}>
                        📅 {new Date(ord.date).toLocaleDateString("en-IN")} • {ord.slotKey?.toUpperCase()}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                      <strong>₹{((ord.totalPaise || 0) / 100).toLocaleString("en-IN")}</strong>
                      <button
                        type="button"
                        className="btn-admin-primary"
                        style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobSheetOrder(ord);
                        }}
                      >
                        🖨️ Job Sheet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-action-edit"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-action-edit"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE: KANBAN BOARD */
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
          {ORDER_STATUSES.map((status) => {
            const columnOrders = orders.filter((o) => o.status === status);
            return (
              <div
                key={status}
                style={{
                  minWidth: "260px",
                  flex: 1,
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ textTransform: "capitalize", fontSize: "0.95rem", color: "#0f172a" }}>
                    {status}
                  </strong>
                  <span className="status-pill status-new" style={{ fontSize: "0.72rem" }}>
                    {columnOrders.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {columnOrders.map((ord) => (
                    <div
                      key={ord._id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedOrderId(ord._id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", color: "#b88932", fontWeight: 700 }}>
                          #{ord.orderNumber}
                        </span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                          ₹{((ord.totalPaise || 0) / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                        {ord.customer?.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        📅 {new Date(ord.date).toLocaleDateString("en-IN")} • {ord.slotKey}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL DRAWER / SHEET */}
      {selectedOrderId && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderId(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "750px", width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  Order #{activeOrder?.orderNumber || "..."}
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Status: <strong style={{ textTransform: "capitalize" }}>{activeOrder?.status}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {detailLoading || !activeOrder ? (
                <p>Loading order details...</p>
              ) : (
                <>
                  {/* Status Stepper */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                      Pipeline Status
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {ORDER_STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(activeOrder._id, st)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: activeOrder.status === st ? "#0f172a" : "#ffffff",
                            color: activeOrder.status === st ? "#ffffff" : "#475569",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                            cursor: "pointer",
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer and Logistics Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div className="sub-answer-item">
                      <div className="sub-answer-label">Customer Info</div>
                      <div className="sub-answer-value">{activeOrder.customer?.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px" }}>
                        📞 {activeOrder.customer?.phone}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        📍 {activeOrder.customer?.address} (PIN: {activeOrder.customer?.pincode})
                      </div>
                    </div>

                    <div className="sub-answer-item">
                      <div className="sub-answer-label">Scheduled Date & Slot</div>
                      <div className="sub-answer-value">
                        {new Date(activeOrder.date).toLocaleDateString("en-IN", { dateStyle: "full" })}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#b88932", fontWeight: 700 }}>
                        Slot: {activeOrder.slotKey?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Reschedule Section */}
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      🗓️ Reschedule Setup Slot
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <input
                        type="date"
                        className="fb-input"
                        style={{ width: "auto" }}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                      />
                      <select
                        className="fb-select"
                        style={{ width: "auto" }}
                        value={rescheduleSlot}
                        onChange={(e) => setRescheduleSlot(e.target.value)}
                      >
                        <option value="">-- Choose Slot --</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (1 PM - 4 PM)</option>
                        <option value="evening">Evening (4:30 PM - 7:30 PM)</option>
                        <option value="midnight">Midnight (10:30 PM - 11:45 PM)</option>
                      </select>
                      <button
                        type="button"
                        className="btn-admin-primary"
                        onClick={handleReschedule}
                        style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                      >
                        Update Slot
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                      Package Items
                    </div>
                    {(activeOrder.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <div>
                          <strong>{it.titleSnapshot}</strong> x {it.quantity}
                          {it.addOns && it.addOns.length > 0 && (
                            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                              Add-ons: {it.addOns.map((a) => a.name).join(", ")}
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          ₹{((it.unitPricePaise * it.quantity) / 100).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment and Refund Section */}
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                          Payment Summary ({activeOrder.paymentStatus?.toUpperCase()})
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Total: ₹{((activeOrder.totalPaise || 0) / 100).toLocaleString("en-IN")} • Advance Due: ₹{((activeOrder.advanceDuePaise || 0) / 100).toLocaleString("en-IN")} • Paid: ₹{((activeOrder.paidAmountPaise || 0) / 100).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-admin-primary"
                        onClick={() => setJobSheetOrder(activeOrder)}
                        style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                      >
                        🖨️ View Job Sheet
                      </button>
                    </div>

                    {/* Owner-only Refund Controls */}
                    {isOwner && (activeOrder.paidAmountPaise || 0) > 0 && (
                      <form onSubmit={handleRefundSubmit} style={{ marginTop: "14px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#dc2626", marginBottom: "6px" }}>
                          💸 Issue Refund (Owner Only)
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="number"
                            className="fb-input"
                            style={{ width: "160px" }}
                            placeholder="Amount in paise"
                            value={refundAmountPaise}
                            onChange={(e) => setRefundAmountPaise(e.target.value)}
                          />
                          <input
                            type="text"
                            className="fb-input"
                            placeholder="Reason for refund"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="btn-action-delete"
                            style={{ whiteSpace: "nowrap" }}
                            disabled={refundMutation.isPending}
                          >
                            {refundMutation.isPending ? "Refunding..." : "Process Refund"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                      Delivery / Internal Notes
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="fb-input"
                        placeholder="Add delivery note / gate code..."
                        value={adminNoteText}
                        onChange={(e) => setAdminNoteText(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-admin-primary"
                        onClick={handleAddNote}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Save Note
                      </button>
                    </div>
                    {activeOrder.deliveryNotes && (
                      <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#475569" }}>
                        {activeOrder.deliveryNotes}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-action-edit" onClick={() => setSelectedOrderId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Job Sheet Modal */}
      {jobSheetOrder && (
        <OrderJobSheet order={jobSheetOrder} onClose={() => setJobSheetOrder(null)} />
      )}
    </div>
  );
}

export default OrdersManager;
