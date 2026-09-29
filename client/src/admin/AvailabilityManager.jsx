import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminAvailabilityMonth,
  toggleAdminBlockDate,
  updateAdminSlotCapacity,
} from "../services/api";

function AvailabilityManager() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  // Active day details modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingCapacity, setEditingCapacity] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["adminAvailabilityMonth", currentYear, currentMonth],
    queryFn: async () => {
      const res = await getAdminAvailabilityMonth({ year: currentYear, month: currentMonth });
      return res.data?.data;
    },
    staleTime: 30000,
  });

  // Toggle Blackout Date Mutation
  const blockMutation = useMutation({
    mutationFn: (date) => toggleAdminBlockDate(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAvailabilityMonth", currentYear, currentMonth] });
      if (selectedDay) {
        setSelectedDay((prev) => ({ ...prev, isBlackout: !prev.isBlackout }));
      }
    },
  });

  // Update Slot Capacity Mutation
  const capacityMutation = useMutation({
    mutationFn: ({ slotKey, capacityPerDay }) =>
      updateAdminSlotCapacity(slotKey, capacityPerDay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAvailabilityMonth", currentYear, currentMonth] });
      alert("Slot capacity updated!");
    },
  });

  const days = data?.days || [];
  const slotsConfig = data?.slotsConfig || [];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Slot Availability & Blackout Dates</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Control setup capacity per day and block dates for maintenance or festive rush.
          </p>
        </div>

        {/* Month Navigation */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button type="button" className="btn-action-edit" onClick={handlePrevMonth}>
            ◀ Prev
          </button>
          <strong style={{ fontSize: "1.1rem", minWidth: "160px", textAlign: "center" }}>
            {monthNames[currentMonth - 1]} {currentYear}
          </strong>
          <button type="button" className="btn-action-edit" onClick={handleNextMonth}>
            Next ▶
          </button>
        </div>
      </div>

      {/* Global Slots Capacity Config Banner */}
      <div className="fb-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>Default Daily Capacity Per Slot:</strong>
            <span style={{ fontSize: "0.82rem", color: "#64748b", marginLeft: "8px" }}>
              (Click a slot to adjust maximum simultaneous setups)
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {slotsConfig.map((slot) => (
              <div
                key={slot.key}
                style={{
                  background: "#f8fafc",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.82rem",
                }}
              >
                <span>{slot.label}:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  defaultValue={slot.capacityPerDay || 5}
                  onChange={(e) =>
                    setEditingCapacity({ ...editingCapacity, [slot.key]: parseInt(e.target.value, 10) })
                  }
                  style={{ width: "45px", padding: "2px 4px", textAlign: "center", borderRadius: "4px", border: "1px solid #94a3b8" }}
                />
                <button
                  type="button"
                  className="btn-action-edit"
                  style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                  onClick={() =>
                    capacityMutation.mutate({
                      slotKey: slot.key,
                      capacityPerDay: editingCapacity[slot.key] || slot.capacityPerDay || 5,
                    })
                  }
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="fb-card" style={{ padding: "20px" }}>
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading calendar...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "8px",
            }}
          >
            {/* Days of week header */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "#64748b",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                {day}
              </div>
            ))}

            {/* Days of Month */}
            {days.map((day) => {
              const dateObj = new Date(day.date);
              const dayOfWeek = dateObj.getDay();

              return (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    minHeight: "90px",
                    background: day.isBlackout ? "#fef2f2" : "#ffffff",
                    border: `1px solid ${day.isBlackout ? "#fecaca" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    padding: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.88rem", color: day.isBlackout ? "#dc2626" : "#0f172a" }}>
                      {day.dayNumber}
                    </span>
                    {day.isBlackout && (
                      <span style={{ fontSize: "0.65rem", background: "#dc2626", color: "#fff", padding: "1px 4px", borderRadius: "4px", fontWeight: 700 }}>
                        BLOCKED
                      </span>
                    )}
                  </div>

                  {!day.isBlackout ? (
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        Booked: <strong>{day.totalBooked}</strong> / {day.totalCapacity}
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "#e2e8f0",
                          borderRadius: "2px",
                          marginTop: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, Math.round((day.totalBooked / (day.totalCapacity || 1)) * 100))}%`,
                            background: day.totalBooked > 15 ? "#dc2626" : "#b88932",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.72rem", color: "#dc2626", fontStyle: "italic" }}>
                      No setups accepted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Modal / Sheet */}
      {selectedDay && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedDay(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  {new Date(selectedDay.date).toLocaleDateString("en-IN", { dateStyle: "full" })}
                </h3>
                <span style={{ fontSize: "0.8rem", color: selectedDay.isBlackout ? "#dc2626" : "#16a34a", fontWeight: 700 }}>
                  {selectedDay.isBlackout ? "🔴 Date Blocked (Blackout)" : "🟢 Date Available for Bookings"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ marginBottom: "20px" }}>
                <button
                  type="button"
                  className={selectedDay.isBlackout ? "btn-admin-primary" : "btn-action-delete"}
                  style={{ width: "100%", padding: "10px", justifyContent: "center" }}
                  onClick={() => blockMutation.mutate(selectedDay.date)}
                  disabled={blockMutation.isPending}
                >
                  {selectedDay.isBlackout ? "🔓 Unblock This Date" : "🚫 Block This Date (Blackout)"}
                </button>
              </div>

              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>
                Slot Breakdown on this Day:
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(selectedDay.slots || []).map((slot) => (
                  <div
                    key={slot.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <strong>{slot.label}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        ⏰ {slot.startTime} - {slot.endTime}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        {slot.booked} / {slot.capacity} Booked
                      </div>
                      <div style={{ fontSize: "0.75rem", color: slot.remaining > 0 ? "#16a34a" : "#dc2626" }}>
                        {slot.remaining} slots open
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-action-edit" onClick={() => setSelectedDay(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailabilityManager;
