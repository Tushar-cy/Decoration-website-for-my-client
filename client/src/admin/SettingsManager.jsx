import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminSettings, updateAdminSettings } from "../services/api";
import RoleGuard from "./components/RoleGuard";
import { useAdminUser } from "./hooks/useAdminUser";

function SettingsManagerContent({ currentUser }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const res = await getAdminSettings();
      return res.data?.data?.settings;
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (settingsData) {
      setFormData(JSON.parse(JSON.stringify(settingsData)));
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (updated) => updateAdminSettings(updated),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      setFeedback({ type: "success", message: "Settings saved successfully!" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.response?.data?.error?.message || "Failed to save settings.",
      });
    },
  });

  if (isLoading || !formData) {
    return <div style={{ padding: "40px", color: "#64748b" }}>Loading settings...</div>;
  }

  const handlePincodeAdd = () => {
    const pincodes = [...(formData.serviceablePincodes || [])];
    pincodes.push({ pincode: "122001", deliveryFeePaise: 0 });
    setFormData({ ...formData, serviceablePincodes: pincodes });
  };

  const handlePincodeUpdate = (idx, field, val) => {
    const pincodes = [...formData.serviceablePincodes];
    pincodes[idx] = { ...pincodes[idx], [field]: val };
    setFormData({ ...formData, serviceablePincodes: pincodes });
  };

  const handlePincodeDelete = (idx) => {
    const pincodes = [...formData.serviceablePincodes];
    pincodes.splice(idx, 1);
    setFormData({ ...formData, serviceablePincodes: pincodes });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);
    saveMutation.mutate(formData);
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Store & Business Settings</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Owner configuration for business contact info, serviceable pincodes, and WhatsApp integrations.
          </p>
        </div>

        <button
          type="button"
          className="btn-admin-primary"
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "💾 Save Settings"}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            background: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "success" ? "#166534" : "#991b1b",
            fontSize: "0.9rem",
          }}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* ─── Operational Switches ─────────────────────────────── */}
        <div className="fb-card" style={{ border: "2px solid #f59e0b" }}>
          <div className="fb-card-title" style={{ color: "#b45309" }}>⚡ Operational Switches</div>
          <p style={{ fontSize: "0.84rem", color: "#78350f", marginBottom: "16px", lineHeight: 1.5 }}>
            Changes take effect site-wide within 60 seconds — <strong>no deploy required.</strong>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Bookings Paused toggle */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ paddingTop: "3px" }}>
                <input
                  type="checkbox"
                  id="flag-bookings-paused"
                  style={{ width: 20, height: 20, cursor: "pointer", accentColor: "#dc2626" }}
                  checked={!!formData.flags?.bookingsPaused}
                  onChange={(e) =>
                    setFormData({ ...formData, flags: { ...(formData.flags || {}), bookingsPaused: e.target.checked } })
                  }
                />
              </div>
              <div>
                <label htmlFor="flag-bookings-paused" style={{ fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}>
                  🛑 Pause New Enquiries
                </label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0" }}>
                  Check to show a "temporarily paused" message on the site. WhatsApp contact remains active.
                </p>
              </div>
            </div>

            {/* Maintenance Banner */}
            <div className="fb-input-group">
              <label className="fb-input-label">
                📢 Site-Wide Announcement Banner
                <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: "6px" }}>(leave blank to hide)</span>
              </label>
              <input
                type="text"
                className="fb-input"
                placeholder="e.g. We're closed on 15 Oct for Diwali. Bookings resume 16 Oct."
                value={formData.flags?.maintenanceBanner || ""}
                onChange={(e) =>
                  setFormData({ ...formData, flags: { ...(formData.flags || {}), maintenanceBanner: e.target.value.slice(0, 300) } })
                }
                maxLength={300}
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="fb-card">
          <div className="fb-card-title">🏢 Business Information</div>
          <div className="fb-field-grid">
            <div className="fb-input-group">
              <label className="fb-input-label">Business Name</label>
              <input
                type="text"
                className="fb-input"
                value={formData.business?.name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="fb-input-group">
              <label className="fb-input-label">Calling Phone (+91)</label>
              <input
                type="text"
                className="fb-input"
                value={formData.business?.phone || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, phone: e.target.value },
                  })
                }
              />
            </div>

            <div className="fb-input-group">
              <label className="fb-input-label">WhatsApp Number</label>
              <input
                type="text"
                className="fb-input"
                value={formData.business?.whatsapp || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, whatsapp: e.target.value },
                  })
                }
              />
            </div>

            <div className="fb-input-group">
              <label className="fb-input-label">Support Email</label>
              <input
                type="email"
                className="fb-input"
                value={formData.business?.email || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, email: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="fb-input-group" style={{ marginTop: "14px" }}>
            <label className="fb-input-label">Storefront Address</label>
            <input
              type="text"
              className="fb-input"
              value={formData.business?.address || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  business: { ...formData.business, address: e.target.value },
                })
              }
            />
          </div>
        </div>


        {/* Serviceable Pincodes and Delivery Fees */}
        <div className="fb-card">
          <div className="fb-card-title">
            <span>📍 Gurugram Serviceable Pincodes ({formData.serviceablePincodes?.length || 0})</span>
            <button
              type="button"
              className="btn-action-edit"
              style={{ fontSize: "0.8rem", padding: "4px 8px" }}
              onClick={handlePincodeAdd}
            >
              ➕ Add Pincode
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {(formData.serviceablePincodes || []).map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  background: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <input
                  type="text"
                  className="fb-input"
                  style={{ width: "90px" }}
                  placeholder="PIN"
                  value={p.pincode}
                  onChange={(e) => handlePincodeUpdate(idx, "pincode", e.target.value)}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Fee(₹):</span>
                  <input
                    type="number"
                    className="fb-input"
                    style={{ width: "70px" }}
                    placeholder="Fee"
                    value={(p.deliveryFeePaise || 0) / 100}
                    onChange={(e) =>
                      handlePincodeUpdate(
                        idx,
                        "deliveryFeePaise",
                        (parseInt(e.target.value, 10) || 0) * 100
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn-action-delete"
                  style={{ padding: "4px 8px" }}
                  onClick={() => handlePincodeDelete(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

function SettingsManager() {
  const { currentUser } = useAdminUser();
  return (
    <RoleGuard user={currentUser} requiredRole="owner">
      <SettingsManagerContent currentUser={currentUser} />
    </RoleGuard>
  );
}

export default SettingsManager;
