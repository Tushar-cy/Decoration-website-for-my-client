import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsers,
  inviteAdminUser,
  toggleAdminUserStatus,
  resetAdminUserPassword,
} from "../services/api";
import RoleGuard from "./components/RoleGuard";

function UsersManagerContent({ currentUser }) {
  const queryClient = useQueryClient();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [feedback, setFeedback] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await getAdminUsers();
      return res.data?.data?.users || [];
    },
    staleTime: 30000,
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => inviteAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setInviteModalOpen(false);
      setInviteForm({ name: "", email: "", password: "", role: "staff" });
      setFeedback({ type: "success", message: "User account created successfully!" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.response?.data?.error?.message || "Failed to invite user.",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleAdminUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || "Failed to change user status.");
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, newPassword }) => resetAdminUserPassword(id, newPassword),
    onSuccess: () => {
      setResetModalUser(null);
      setNewPassword("");
      alert("Password has been reset successfully.");
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || "Password reset failed.");
    },
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);
    inviteMutation.mutate(inviteForm);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    resetMutation.mutate({ id: resetModalUser._id, newPassword });
  };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Staff & Access Control</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Owner permissions: invite staff members, deactivate accounts, and reset credentials.
          </p>
        </div>

        <button
          type="button"
          className="btn-admin-primary"
          onClick={() => setInviteModalOpen(true)}
        >
          ➕ Invite Staff Member
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

      <div className="admin-table-card">
        {isLoading ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading users...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name & Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>✉️ {u.email}</div>
                  </td>

                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: u.role === "owner" ? "#fef3c7" : "#e0e7ff",
                        color: u.role === "owner" ? "#92400e" : "#3730a3",
                      }}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td>
                    <span className={`status-pill ${u.isActive ? "status-completed" : "status-lost"}`}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>

                  <td style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-IN")}
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => setResetModalUser(u)}
                      >
                        Reset Password
                      </button>

                      {u._id !== currentUser?.id && (
                        <button
                          type="button"
                          className={u.isActive ? "btn-action-delete" : "btn-action-edit"}
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: u._id, isActive: !u.isActive })
                          }
                        >
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setInviteModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Invite New Team Member</h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="fb-input-group">
                  <label className="fb-input-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="fb-input"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  />
                </div>

                <div className="fb-input-group">
                  <label className="fb-input-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="fb-input"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>

                <div className="fb-input-group">
                  <label className="fb-input-label">Initial Password * (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="fb-input"
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  />
                </div>

                <div className="fb-input-group">
                  <label className="fb-input-label">Role</label>
                  <select
                    className="fb-select"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  >
                    <option value="staff">Staff (Orders & Inquiries)</option>
                    <option value="owner">Store Owner (Full Control)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-action-edit" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-primary"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="admin-modal-backdrop" onClick={() => setResetModalUser(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Reset Password for {resetModalUser.name}</h3>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div className="admin-modal-body">
                <div className="fb-input-group">
                  <label className="fb-input-label">New Password (min 8 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="fb-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-action-edit" onClick={() => setResetModalUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? "Updating..." : "Set New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersManager({ currentUser }) {
  return (
    <RoleGuard user={currentUser} requiredRole="owner">
      <UsersManagerContent currentUser={currentUser} />
    </RoleGuard>
  );
}

export default UsersManager;
