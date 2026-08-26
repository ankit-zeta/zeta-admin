"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import {
  Shield,
  Search,
  FileText,
  Clock,
  User,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  LogIn,
  Filter,
} from "lucide-react";

type Tab = "audit" | "logins";

export default function AdminAuditLogsPage() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>("audit");
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  // Audit logs query
  const logs = useQuery(
    api.auditLogs.getAuditLogs,
    tab === "audit" && token
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

  // Login history query
  const logins = useQuery(
    api.auditLogs.getLoginHistory,
    tab === "logins" && token
      ? {
          token,
          search: search || undefined,
        }
      : "skip"
  ) as Array<{
    _id: string;
    userId: string;
    userEmail: string;
    userName: string;
    createdAt: number;
    expiresAt: number;
    ip: string;
    userAgent: string;
    deviceType: string;
    deviceOS: string;
    deviceBrowser: string;
    location: string;
  }> | undefined;

  const deviceIcon = (type: string) => {
    if (type === "mobile") return <Smartphone className="w-3.5 h-3.5" />;
    if (type === "tablet") return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
  };

  const deviceColor = (type: string) => {
    if (type === "mobile") return "bg-blue-100 text-blue-800";
    if (type === "tablet") return "bg-purple-100 text-purple-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const isActive = (expiresAt: number) => expiresAt > Date.now();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Administrative Audit Trail
        </h1>
        <p className="text-xs text-textMuted">
          Immutable ledger of sensitive operations and login activity across the platform.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
        <button
          onClick={() => { setTab("audit"); setSearch(""); setEntityType(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            tab === "audit"
              ? "bg-white text-textMain shadow-sm"
              : "text-textMuted hover:text-textMain"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Logs
        </button>
        <button
          onClick={() => { setTab("logins"); setSearch(""); setEntityType(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            tab === "logins"
              ? "bg-white text-textMain shadow-sm"
              : "text-textMuted hover:text-textMain"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Logins &amp; Devices
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                tab === "audit"
                  ? "Search by action, email, or reason..."
                  : "Search by email, IP, device, or location..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          {tab === "audit" && (
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
          )}
        </div>

        <span className="text-xs text-textMuted shrink-0">
          {tab === "audit"
            ? `Showing ${logs?.length || 0} audit records`
            : `Showing ${logins?.length || 0} login sessions`}
        </span>
      </div>

      {/* Audit Log Table */}
      {tab === "audit" && (
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
                        {log.previousValue || "\u2014"}
                      </td>
                      <td className="py-3 px-4 font-bold text-textMain max-w-xs truncate">
                        {log.newValue || "\u2014"}
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
      )}

      {/* Login History Table */}
      {tab === "logins" && (
        <div className="card-surface overflow-hidden">
          {logins === undefined ? (
            <div className="p-8 text-center animate-pulse space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
            </div>
          ) : logins.length === 0 ? (
            <div className="p-12 text-center text-xs text-textMuted">
              No login sessions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                    <th className="py-3 px-4 font-semibold">When</th>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">IP Address</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Device</th>
                    <th className="py-3 px-4 font-semibold">OS</th>
                    <th className="py-3 px-4 font-semibold">Browser</th>
                    <th className="py-3 px-4 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {logins.map((login) => (
                    <tr key={login._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4 text-textMuted whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-textMuted" />
                          {new Date(login.createdAt).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-textMain">{login.userName}</div>
                          <div className="text-[10px] text-textMuted">{login.userEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isActive(login.expiresAt) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-textMain">
                          <Globe className="w-3 h-3 text-textMuted" />
                          {login.ip || "\u2014"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-textMain">
                          <MapPin className="w-3 h-3 text-textMuted" />
                          {login.location || "\u2014"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${deviceColor(login.deviceType)}`}>
                          {deviceIcon(login.deviceType)}
                          {login.deviceType || "Unknown"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-textMuted">
                        {login.deviceOS || "\u2014"}
                      </td>
                      <td className="py-3 px-4 text-textMuted">
                        {login.deviceBrowser || "\u2014"}
                      </td>
                      <td className="py-3 px-4 text-textMuted whitespace-nowrap">
                        {new Date(login.expiresAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
