import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminAuditLogs } from "../services/api";

function AuditLogManager() {
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: auditData, isLoading, refetch } = useQuery({
    queryKey: ["adminAuditLogs", page, entityFilter],
    queryFn: async () => {
      const params = {
        page,
        limit: 25,
        entity: entityFilter !== "all" ? entityFilter : undefined,
      };
      const res = await getAdminAuditLogs(params);
      return res.data?.data;
    },
    staleTime: 30000,
  });

  const logs = auditData?.logs || [];
  const pagination = auditData?.pagination || { page: 1, totalPages: 1 };

  return (
    <div>
      <div className="manager-header">
        <div>
          <h1 className="manager-title">Security & Operations Audit Trail</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px" }}>
            Immutable record of all admin modifications, price alterations, and status transitions.
          </p>
        </div>

        <button
          type="button"
          className="btn-action-edit"
          onClick={() => refetch()}
          style={{ background: "#ffffff" }}
        >
          🔄 Refresh Log
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Filter by Entity:</span>
        <select
          className="fb-select"
          style={{ width: "auto" }}
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Entities</option>
          <option value="Order">Orders</option>
          <option value="Product">Products</option>
          <option value="Settings">Settings</option>
          <option value="Submission">Submissions</option>
          <option value="FormSchema">Form Schema</option>
          <option value="Admin">User Accounts</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-table-card">
        {isLoading ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading audit records...</p>
        ) : logs.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No audit logs recorded.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(log.at).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </td>

                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: log.action.includes("DELETED")
                          ? "#fee2e2"
                          : log.action.includes("CREATED")
                          ? "#dcfce7"
                          : "#eff6ff",
                        color: log.action.includes("DELETED")
                          ? "#991b1b"
                          : log.action.includes("CREATED")
                          ? "#166534"
                          : "#1e40af",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td>
                    <strong>{log.entity}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>ID: {log.entityId}</div>
                  </td>

                  <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{log.ip || "127.0.0.1"}</td>

                  <td>
                    <button
                      type="button"
                      className="btn-action-edit"
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                      onClick={() => setSelectedLog(log)}
                    >
                      Inspect Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Diff Inspector Modal */}
      {selectedLog && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Audit Record: {selectedLog.action}</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <h5 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#dc2626", marginBottom: "6px" }}>
                    State Before Modification:
                  </h5>
                  <pre
                    style={{
                      background: "#f8fafc",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      maxHeight: "250px",
                      overflowY: "auto",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {JSON.stringify(selectedLog.before, null, 2) || "None (New Record)"}
                  </pre>
                </div>

                <div>
                  <h5 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a", marginBottom: "6px" }}>
                    State After Modification:
                  </h5>
                  <pre
                    style={{
                      background: "#f8fafc",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      maxHeight: "250px",
                      overflowY: "auto",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {JSON.stringify(selectedLog.after, null, 2) || "None"}
                  </pre>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-action-edit" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogManager;
