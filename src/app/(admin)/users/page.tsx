"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Search,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";

function fmtINR(n?: number) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function fmtDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ value }: { value: string }) {
  const tone = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    completed: "bg-green-100 text-green-800",
    paid: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    available: "bg-blue-100 text-blue-800",
    pending: "bg-amber-100 text-amber-800",
    qualifying: "bg-blue-100 text-blue-800",
    requested: "bg-amber-100 text-amber-800",
    under_review: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-neutral-200 text-neutral-700",
  };
  return (
    <span
      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
        (tone as any)[value] || "bg-neutral-100 text-neutral-600"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
      <span className="text-textMuted block text-[11px]">{label}</span>
      <strong className={`text-sm font-extrabold ${accent || "text-textMain"}`}>
        {value}
      </strong>
    </div>
  );
}

export default function AdminUsersPage() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const users = useQuery(
    api.users.getAllUsers,
    token
      ? {
          token,
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }
      : "skip"
  );

  const [sortKey, setSortKey] = useState<"joined" | "earned" | "enrolled">("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const sortedUsers = React.useMemo(() => {
    const list = [...(users || [])];
    list.sort((a: any, b: any) => {
      let av: number = 0;
      let bv: number = 0;
      if (sortKey === "earned") {
        av = a.totalEarned || 0;
        bv = b.totalEarned || 0;
      } else if (sortKey === "enrolled") {
        av = a.enrolledCount || 0;
        bv = b.enrolledCount || 0;
      } else {
        av = a.createdAt || 0;
        bv = b.createdAt || 0;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return list;
  }, [users, sortKey, sortDir]);

  const pagedUsers = sortedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil((sortedUsers?.length || 0) / PAGE_SIZE));

  React.useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, users?.length]);

  const exportCsv = () => {
    const header = "Name,Email,Role,Status,Referral Code,Phone,Enrolled,Total Earned,Available,Joined";
    const rows = (sortedUsers || []).map((u: any) =>
      [
        `"${(u.name || "").replace(/"/g, '""')}"`,
        `"${(u.email || "").replace(/"/g, '""')}"`,
        u.role,
        u.status,
        u.referralCode,
        `"${(u.phone || "").replace(/"/g, '""')}"`,
        u.enrolledCount,
        u.totalEarned,
        u.availableBalance,
        new Date(u.createdAt).toISOString().slice(0, 10),
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zetagrow-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [actionMsg, setActionMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Create User (admin) ──
  const createUserMutation = useMutation(api.users.adminCreateUser);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [cuName, setCuName] = useState("");
  const [cuEmail, setCuEmail] = useState("");
  const [cuPassword, setCuPassword] = useState("");
  const [cuSendEmail, setCuSendEmail] = useState(true);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsProcessing(true);
    setActionMsg("");
    try {
      await createUserMutation({
        token,
        name: cuName,
        email: cuEmail,
        password: cuPassword,
        sendWelcomeEmail: cuSendEmail,
      });
      setActionMsg(`Account created for ${cuEmail}. Share the password privately.`);
      setCreateUserOpen(false);
      setCuName(""); setCuEmail(""); setCuPassword(""); setCuSendEmail(true);
    } catch (err: any) {
      const msg = err?.name === "ConvexError" && typeof err.data === "string" ? err.data : err.message;
      setActionMsg(msg || "Failed to create user.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Users & Account Management
        </h1>
        <p className="text-xs text-textMuted">
          Search registered accounts, inspect full user history (programs, affiliate, earnings,
          activity), adjust status, and audit actions.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {actionMsg}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white text-textMuted"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="super_admin">Super Admin</option>
            <option value="content_admin">Content Admin</option>
            <option value="finance_admin">Finance Admin</option>
            <option value="work_admin">Work Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white text-textMuted"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white text-textMuted"
          >
            <option value="joined">Sort: Joined</option>
            <option value="earned">Sort: Total Earned</option>
            <option value="enrolled">Sort: Enrolled</option>
          </select>
          <button
            onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
            className="btn-secondary text-[11px] py-1.5 px-2.5"
          >
            {sortDir === "desc" ? "Desc ↓" : "Asc ↑"}
          </button>
          <button
            onClick={exportCsv}
            className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setCreateUserOpen(true)}
            className="btn-primary text-[11px] py-1.5 px-2.5 flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create User
          </button>
          <span className="text-xs text-textMuted">
            {sortedUsers.length} accounts · page {page}/{totalPages}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-surface overflow-hidden">
        {users === undefined ? (
          <div className="p-8 text-center animate-pulse space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-textMuted">
            No users match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-borderSubtle bg-neutral-50 text-textMuted">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Referral Code</th>
                  <th className="py-3 px-4 font-semibold">Enrolled</th>
                  <th className="py-3 px-4 font-semibold">Total Earned</th>
                  <th className="py-3 px-4 font-semibold">Joined</th>
                  <th className="py-3 px-4 font-semibold">Wallet</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {pagedUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-textMain block">{u.name}</span>
                        <span className="text-[11px] text-textMuted">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 font-semibold uppercase">
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {u.referralCode}
                    </td>
                    <td className="py-3 px-4 text-textMain font-medium">
                      {u.enrolledCount} Programs
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-700">
                      {fmtINR(u.totalEarned)}
                    </td>
                    <td className="py-3 px-4 text-textMuted text-[11px]">
                      {fmtDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-bold text-textMain">
                      {fmtINR(u.availableBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge value={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => router.push(`/users/${u._id}`)}
                        className="btn-secondary text-[11px] py-1 px-2.5"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {users && users.length > PAGE_SIZE && (
        <div className="flex items-center justify-between card-surface p-3">
          <span className="text-xs text-textMuted">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, sortedUsers.length)} of {sortedUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-[11px] py-1.5 px-2.5 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-[11px] py-1.5 px-2.5 disabled:opacity-40 flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card-surface w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-textMain flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-600" /> Create User Account
              </h3>
              <button onClick={() => setCreateUserOpen(false)} className="text-textMuted hover:text-textMain">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Full Name *</span>
                <input required minLength={2} value={cuName} onChange={(e) => setCuName(e.target.value)} placeholder="e.g. Priya Sharma" className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white" />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Email *</span>
                <input required type="email" value={cuEmail} onChange={(e) => setCuEmail(e.target.value)} placeholder="person@example.com" className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white" />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Password * (min 8 chars)</span>
                <input required minLength={8} value={cuPassword} onChange={(e) => setCuPassword(e.target.value)} placeholder="Set a temporary password" className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white font-mono" />
              </label>
              <label className="flex items-center gap-2 text-xs text-textMain cursor-pointer">
                <input type="checkbox" checked={cuSendEmail} onChange={(e) => setCuSendEmail(e.target.checked)} className="rounded border-borderSubtle text-brand-600" />
                Send them a welcome email (password is never emailed — share it privately)
              </label>
              <p className="text-[10px] text-textMuted">
                Account is created active &amp; verified, with wallet and referral code ready. Action is audit-logged.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setCreateUserOpen(false)} className="btn-secondary text-xs py-2 px-3">Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-primary text-xs py-2 px-4 disabled:opacity-60">
                  {isProcessing ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}