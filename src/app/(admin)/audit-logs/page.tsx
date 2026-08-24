"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Shield, Search, FileText, Clock, User } from "lucide-react";

export default function AdminAuditLogsPage() {
  const { token } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  const logs = useQuery(
    api.auditLogs.getAuditLogs,
    token
      ? {
          token,
          search: search || undefined,
          entityType: entityType || undefined,
        }
      : "skip"
  ) as Array<{
    _id: string;
    _creationTime: number;
    adminUserId: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue: string | undefined;
    newValue: string | undefined;
    reason: string | undefined;
    timestamp: number;
  }> | undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Administrative Audit Trail
        </h1>
        <p className="text-xs text-textMuted">
          Immutable ledger of sensitive operations including status adjustments, manual wallet credits, and policy rule modifications.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, email, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white text-textMuted"
          >
            <option value="">All Entity Types</option>
            <option value="users">Users</option>
            <option value="programs">Programs</option>
            <option value="jobs">Jobs</option>
            <option value="jobApplications">Applications</option>
            <option value="affiliateSales">Commissions</option>
            <option value="wallets">Wallets</option>
            <option value="withdrawals">Withdrawals</option>
            <option value="adminSettings">Settings</option>
          </select>
        </div>

        <span className="text-xs text-textMuted shrink-0">
          Showing {logs?.length || 0} audit records
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="card-surface overflow-hidden">
        {logs === undefined ? (
          <div className="p-8 text-center animate-pulse space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-textMuted">
            No audit records matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Administrator</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Entity Target</th>
                  <th className="py-3 px-4 font-semibold">Previous Value</th>
                  <th className="py-3 px-4 font-semibold">New Value</th>
                  <th className="py-3 px-4 font-semibold">Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4 text-textMuted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-medium text-textMain">
                      {log.adminEmail}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-neutral-100 text-brand-900 px-2 py-0.5 rounded font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-textMuted">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-3 px-4 text-textMuted max-w-xs truncate">
                      {log.previousValue || "—"}
                    </td>
                    <td className="py-3 px-4 font-bold text-textMain max-w-xs truncate">
                      {log.newValue || "—"}
                    </td>
                    <td className="py-3 px-4 text-textMuted max-w-xs truncate">
                      {log.reason || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
