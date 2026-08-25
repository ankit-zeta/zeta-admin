"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Users,
  Search,
  Shield,
  CheckCircle2,
  X,
  BookOpen,
  Wallet,
  Plus,
  UserRound,
  TrendingUp,
  Activity,
  Award,
  CreditCard,
  History,
  ArrowDownToLine,
  Download,
  KeyRound,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Crown,
} from "lucide-react";

type TabKey = "overview" | "programs" | "affiliate" | "earnings" | "activity";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: UserRound },
  { key: "programs", label: "Programs", icon: BookOpen },
  { key: "affiliate", label: "Affiliate", icon: TrendingUp },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "activity", label: "Activity", icon: Activity },
];

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

  const programs = useQuery(api.programs.getPublicPrograms);

  const updateUserStatusMutation = useMutation(api.users.updateUserStatus);
  const grantProgramMutation = useMutation(api.users.grantProgramAccess);
  const adjustWalletMutation = useMutation(api.wallets.adminAdjustWallet);
  const updateRoleMutation = useMutation(api.users.updateUserRole);
  const resetPasswordMutation = useMutation(api.users.adminResetPassword);

  const [selectedUserId, setSelectedUserId] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const userDetails = useQuery(
    api.users.getUserDetails,
    token && selectedUserId ? { token, userId: selectedUserId } : "skip"
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

  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantProgId, setGrantProgId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustReason, setAdjustReason] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleValue, setRoleValue] = useState("user");
  const [roleReason, setRoleReason] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPass, setResetPass] = useState("");
  const [resetReason, setResetReason] = useState("");
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

  // ── Growth Partner Program access ──
  const setPartnerAccessMutation = useMutation(api.partners.setPartnerAccess);
  const partnerDir = useQuery(api.partners.getPartnerDirectoryAdmin, token ? { token } : "skip") as
    | Array<{ _id: string; tierName: string; chainPct: number; partnerSince: number | null }>
    | undefined;
  const isPartner =
    !!selectedUserId && (partnerDir || []).some((p) => p._id === selectedUserId);

  const handleTogglePartner = async () => {
    if (!token || !selectedUserId || !userDetails?.user) return;
    const verb = isPartner ? "REVOKE" : "GRANT";
    const reason = window.prompt(
      `${verb === "GRANT" ? "Grant" : "Revoke"} Growth Partner access for ${userDetails.user.name}?\nReason (recorded in audit trail):`,
      verb === "GRANT" ? "Invited to Growth Partner Program" : "Program access reviewed"
    );
    if (!reason) return;
    setIsProcessing(true);
    setActionMsg("");
    try {
      await setPartnerAccessMutation({ token, userId: selectedUserId, grant: !isPartner, reason });
      setActionMsg(
        !isPartner
          ? `${userDetails.user.name} is now a Growth Partner 🎉 They'll see the exclusive Partnership section in their Affiliate Center.`
          : "Growth Partner access revoked."
      );
    } catch (err: any) {
      const msg = err?.name === "ConvexError" && typeof err.data === "string" ? err.data : err.message;
      setActionMsg(msg || "Failed to update partner access.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!token || !selectedUserId || !userDetails?.user) return;
    setIsProcessing(true);
    setActionMsg("");
    const newStatus = userDetails.user.status === "active" ? "suspended" : "active";

    try {
      await updateUserStatusMutation({
        token,
        userId: selectedUserId,
        status: newStatus,
        reason: suspendReason || `Admin manual toggle to ${newStatus}`,
      });
      setActionMsg(`User status updated to ${newStatus}.`);
      setSuspendModalOpen(false);
      setSuspendReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed to update status.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserId || !adjustAmount || !adjustReason) return;
    setIsProcessing(true);
    setActionMsg("");
    try {
      const amt = parseFloat(adjustAmount);
      if (!isFinite(amt) || amt <= 0) throw new Error("Enter a valid positive amount");
      const res = await adjustWalletMutation({
        token,
        userId: selectedUserId,
        amount: amt,
        type: adjustType,
        reason: adjustReason,
      });
      setActionMsg(`Wallet adjusted. New balance: ₹${res.newBalance.toLocaleString("en-IN")}`);
      setAdjustModalOpen(false);
      setAdjustAmount("");
      setAdjustReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed to adjust wallet.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserId || !roleReason) return;
    setIsProcessing(true);
    setActionMsg("");
    try {
      await updateRoleMutation({ token, userId: selectedUserId, role: roleValue, reason: roleReason });
      setActionMsg(`Role updated to ${roleValue.replace(/_/g, " ")}.`);
      setRoleModalOpen(false);
      setRoleReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed to update role.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserId || !resetPass || !resetReason) return;
    setIsProcessing(true);
    setActionMsg("");
    try {
      await resetPasswordMutation({ token, userId: selectedUserId, newPassword: resetPass, reason: resetReason });
      setActionMsg("Password reset. All user sessions were invalidated.");
      setResetModalOpen(false);
      setResetPass("");
      setResetReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed to reset password.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrantProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserId || !grantProgId) return;

    setIsProcessing(true);
    setActionMsg("");

    try {
      await grantProgramMutation({
        token,
        userId: selectedUserId,
        programId: grantProgId as any,
        reason: grantReason || "Admin manual curriculum grant",
      });
      setActionMsg("Program access granted successfully.");
      setGrantModalOpen(false);
      setGrantReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed to grant program.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDrawer = () => {
    setSelectedUserId(null);
    setActiveTab("overview");
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
                    <td className="py-3 px-4">
                      <StatusBadge value={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedUserId(u._id)}
                        className="btn-secondary text-[11px] py-1 px-2.5"
                      >
                        Inspect Details
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

      {/* User Details Drawer */}
      {selectedUserId && userDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl h-full overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-borderSubtle pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-textMain">
                    {userDetails.user.name}
                  </h3>
                  <StatusBadge value={userDetails.user.status} />
                  <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 uppercase">
                    {userDetails.user.role.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-textMuted">{userDetails.user.email}</p>
                <p className="text-[11px] text-textMuted">
                  Joined {fmtDate(userDetails.user.createdAt)}
                  {userDetails.user.phone ? ` · ${userDetails.user.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResetModalOpen(true)}
                  className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    setRoleValue(
                      userDetails.user.role === "user" ? "content_admin" : "user"
                    );
                    setRoleModalOpen(true);
                  }}
                  className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Change Role
                </button>
                <button
                  onClick={() => setSuspendModalOpen(true)}
                  className={`btn-secondary text-[11px] py-1.5 px-3 ${
                    userDetails.user.status === "active"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-green-600 hover:bg-green-50"
                  }`}
                >
                  {userDetails.user.status === "active" ? "Suspend" : "Activate"}
                </button>
                <button
                  onClick={closeDrawer}
                  className="p-1 rounded-lg text-textMuted hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-borderSubtle pb-2 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === t.key
                      ? "bg-brand-600 text-white"
                      : "text-textMuted hover:bg-neutral-100"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Wallet Balance"
                    value={fmtINR(userDetails.wallet?.availableBalance)}
                    accent="text-brand-700"
                  />
                  <StatCard
                    label="Total Earned"
                    value={fmtINR(userDetails.wallet?.totalEarned)}
                    accent="text-brand-700"
                  />
                  <StatCard
                    label="Direct Referrals"
                    value={`${userDetails.referralsCount} Users`}
                  />
                  <StatCard
                    label="Referral Conversion"
                    value={`${userDetails.affiliateStats?.conversionRate || 0}%`}
                  />
                  <StatCard
                    label="Enrolled Programs"
                    value={`${userDetails.enrolledPrograms.length}`}
                  />
                  <StatCard
                    label="Affiliate Commission"
                    value={fmtINR(userDetails.affiliateStats?.commissionEarned)}
                    accent="text-brand-700"
                  />
                  <StatCard
                    label="Achievements"
                    value={`${userDetails.achievementsCount}`}
                  />
                  <StatCard
                    label="Support Tickets"
                    value={`${userDetails.supportTickets?.length || 0}`}
                  />
                </div>

                {userDetails.user.skills?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-xs text-textMain">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {userDetails.user.skills.map((s: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {userDetails.user.bio && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-textMain">Bio</h4>
                    <p className="text-xs text-textMuted">{userDetails.user.bio}</p>
                  </div>
                )}

                <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle space-y-1">
                  <p className="text-xs">
                    <span className="text-textMuted">Referral Code: </span>
                    <span className="font-mono font-bold text-brand-700">
                      {userDetails.user.referralCode}
                    </span>
                  </p>
                  <p className="text-xs">
                    <span className="text-textMuted">Notifications: </span>
                    <strong>{userDetails.notificationsCount || 0}</strong>
                  </p>
                  <p className="text-xs">
                    <span className="text-textMuted">Audit Events: </span>
                    <strong>{userDetails.auditLogs?.length || 0}</strong>
                  </p>
                </div>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => setGrantModalOpen(true)}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Grant Program Access
                  </button>
                  <button
                    onClick={handleTogglePartner}
                    disabled={isProcessing}
                    className={`text-xs py-2 px-4 flex items-center gap-1.5 rounded-lg font-semibold border transition-colors disabled:opacity-50 ${
                      isPartner
                        ? "bg-white border-borderSubtle text-textMain hover:bg-neutral-50"
                        : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    <Crown className={`w-3.5 h-3.5 ${isPartner ? "text-amber-500" : ""}`} />
                    {isPartner ? "Growth Partner ✓ (Revoke?)" : "Invite as Growth Partner"}
                  </button>
                </div>
              </div>
            )}

            {/* PROGRAMS */}
            {activeTab === "programs" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-textMain">
                    Purchases ({userDetails.enrolledPrograms.length})
                  </h4>
                  <button
                    onClick={() => setGrantModalOpen(true)}
                    className="text-brand-700 hover:underline font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Grant Program
                  </button>
                </div>
                {userDetails.enrolledPrograms.length === 0 ? (
                  <p className="text-textMuted text-xs py-2">No program purchases.</p>
                ) : (
                  <div className="space-y-1.5">
                    {userDetails.enrolledPrograms.map((ep: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-brand-50/50 rounded-lg border border-brand-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-textMain text-xs truncate">
                            {ep.program?.name || "Program"}
                          </p>
                          <p className="text-[10px] text-textMuted">
                            {fmtDate(ep.purchase.createdAt)} ·{" "}
                            {ep.purchase.accessType === "admin_grant" || ep.purchase.paymentMethod === "manual_grant"
                              ? "🎁 Free Giveaway"
                              : ep.purchase.paymentMethod === "manual_grant"
                                ? ep.purchase.paymentMethod
                                : `Sale · ${ep.purchase.paymentMethod || "—"}`}
                            · {ep.purchase.paymentId || ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-brand-700 text-xs">
                            {fmtINR(ep.purchase.amount)}
                          </span>
                          <StatusBadge value={ep.purchase.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AFFILIATE */}
            {activeTab === "affiliate" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Total Referrals"
                    value={`${userDetails.affiliateStats?.totalReferrals || 0}`}
                  />
                  <StatCard
                    label="Converted (Bought)"
                    value={`${userDetails.affiliateStats?.convertedReferrals || 0}`}
                  />
                  <StatCard
                    label="Conversion Rate"
                    value={`${userDetails.affiliateStats?.conversionRate || 0}%`}
                  />
                  <StatCard
                    label="Commission Earned"
                    value={fmtINR(userDetails.affiliateStats?.commissionEarned)}
                    accent="text-brand-700"
                  />
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between">
                  <span className="text-xs text-textMuted">Pending Commission (holding)</span>
                  <strong className="text-xs text-amber-700">
                    {fmtINR(userDetails.affiliateStats?.pendingCommission)}
                  </strong>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Referred Users ({userDetails.referralDetails?.length || 0})
                  </h4>
                  {userDetails.referralDetails?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No referrals yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.referralDetails.map((r: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {r.name}
                              <span className="text-textMuted font-normal"> · {r.email}</span>
                            </p>
                            <p className="text-[10px] text-textMuted">
                              Joined {fmtDate(r.createdAt)}
                              {r.purchasedProgram
                                ? ` · Bought: ${r.purchasedProgram}`
                                : " · No purchase yet"}
                            </p>
                          </div>
                          <StatusBadge value={r.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Affiliate Sales ({userDetails.affiliateSales?.length || 0})
                  </h4>
                  {userDetails.affiliateSales?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No affiliate sales recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.affiliateSales.map((s: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {s.programName}
                            </p>
                            <p className="text-[10px] text-textMuted">
                              Buyer: {s.buyerName} · {fmtDate(s.createdAt)} · {s.ruleUsed}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-textMuted">
                              Sale {fmtINR(s.saleAmount)}
                            </span>
                            <span className="font-bold text-brand-700 text-xs">
                              +{fmtINR(s.commissionAmount)}
                            </span>
                            <StatusBadge value={s.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EARNINGS */}
            {activeTab === "earnings" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Available"
                    value={fmtINR(userDetails.wallet?.availableBalance)}
                    accent="text-green-700"
                  />
                  <StatCard
                    label="Pending"
                    value={fmtINR(userDetails.wallet?.pendingBalance)}
                    accent="text-amber-700"
                  />
                  <StatCard
                    label="Work Earnings"
                    value={fmtINR(userDetails.wallet?.workEarnings)}
                  />
                  <StatCard
                    label="Affiliate Earnings"
                    value={fmtINR(userDetails.wallet?.affiliateEarnings)}
                    accent="text-brand-700"
                  />
                  <StatCard
                    label="Total Earned"
                    value={fmtINR(userDetails.wallet?.totalEarned)}
                    accent="text-brand-700"
                  />
                  <StatCard
                    label="Total Withdrawn"
                    value={fmtINR(userDetails.wallet?.totalWithdrawn)}
                    accent="text-red-700"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setAdjustModalOpen(true)}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <CircleDollarSign className="w-3.5 h-3.5" />
                    Adjust Balance
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Wallet Transactions ({userDetails.walletTransactions?.length || 0})
                  </h4>
                  {userDetails.walletTransactions?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No transactions recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.walletTransactions.map((t: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {t.description || t.type.replace(/_/g, " ")}
                            </p>
                            <p className="text-[10px] text-textMuted">
                              {fmtDate(t.createdAt)} · {t.type.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-bold text-xs ${
                                t.amount < 0 ? "text-red-600" : "text-green-700"
                              }`}
                            >
                              {t.amount < 0 ? "−" : "+"}
                              {fmtINR(Math.abs(t.amount))}
                            </span>
                            <StatusBadge value={t.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Withdrawals ({userDetails.withdrawals?.length || 0})
                  </h4>
                  {userDetails.withdrawals?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No withdrawal requests.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.withdrawals.map((w: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {w.payoutMethod.toUpperCase().replace(/_/g, " ")} ·{" "}
                              {w.payoutDetails?.upiId ||
                                w.payoutDetails?.paypalEmail ||
                                w.payoutDetails?.accountNumber ||
                                "—"}
                            </p>
                            <p className="text-[10px] text-textMuted">
                              Requested {fmtDate(w.requestedAt)}
                              {w.adminNote ? ` · ${w.adminNote}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-textMain text-xs">
                              {fmtINR(w.netAmount)}
                              <span className="text-[10px] text-textMuted font-normal">
                                {" "}
                                +{fmtINR(w.fee)} fee
                              </span>
                            </span>
                            <StatusBadge value={w.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {activeTab === "activity" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Job Applications ({userDetails.applications?.length || 0})
                  </h4>
                  {userDetails.applications?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No job applications.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.applications.map((a: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {a.jobTitle}
                            </p>
                            <p className="text-[10px] text-textMuted">
                              Applied {fmtDate(a.submittedAt)}
                            </p>
                          </div>
                          <StatusBadge value={a.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Certificates ({userDetails.certificates?.length || 0})
                  </h4>
                  {userDetails.certificates?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No certificates issued.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.certificates.map((c: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {c.programName}
                            </p>
                            <p className="text-[10px] text-textMuted font-mono">
                              {c.certificateId} · Issued {fmtDate(c.issueDate)}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded uppercase">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Achievements ({userDetails.achievements?.length || 0})
                  </h4>
                  {userDetails.achievements?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No achievements unlocked.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.achievements.map((a: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {a.achievement?.name || "Achievement"}
                            </p>
                            <p className="text-[10px] text-textMuted">
                              {a.achievement?.description || ""}
                            </p>
                          </div>
                          <span className="text-[10px] text-textMuted shrink-0">
                            {fmtDate(a.unlockedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Support Tickets ({userDetails.supportTickets?.length || 0})
                  </h4>
                  {userDetails.supportTickets?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No support tickets.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.supportTickets.map((t: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {t.subject}
                            </p>
                            <p className="text-[10px] text-textMuted font-mono">
                              {t.ticketId} · {fmtDate(t.createdAt)}
                            </p>
                          </div>
                          <StatusBadge value={t.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-textMain">
                    Admin Audit Trail ({userDetails.auditLogs?.length || 0})
                  </h4>
                  {userDetails.auditLogs?.length === 0 ? (
                    <p className="text-textMuted text-xs py-2">No admin actions on this account.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetails.auditLogs.map((l: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-borderSubtle flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-textMain text-xs truncate">
                              {l.action.replace(/_/g, " ")}
                              {l.reason ? ` — ${l.reason}` : ""}
                            </p>
                            <p className="text-[10px] text-textMuted">
                              by {l.adminEmail} · {fmtDate(l.timestamp)}
                            </p>
                          </div>
                          {l.previousValue !== undefined && (
                            <span className="text-[10px] text-textMuted shrink-0">
                              {l.previousValue} → {l.newValue}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Program Grant Modal */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">Grant Program Access</h3>
            <form onSubmit={handleGrantProgram} className="space-y-3">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Select Program *</label>
                <select
                  required
                  value={grantProgId}
                  onChange={(e) => setGrantProgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                >
                  <option value="">Select a curriculum tier...</option>
                  {programs?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Reason for Manual Grant *</label>
                <input
                  type="text"
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="e.g. Scholarship / Support resolution"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {isProcessing ? "Granting..." : "Confirm Grant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">
              {userDetails?.user.status === "active" ? "Suspend Account" : "Activate Account"}
            </h3>
            <p className="text-xs text-textMuted">
              Please enter an administrative reason for audit logging.
            </p>
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-textMain">Audit Reason *</label>
              <input
                type="text"
                required
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Violation of policy or verified resolution"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={isProcessing || !suspendReason}
                className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Adjustment Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">Adjust Wallet Balance</h3>
            <p className="text-xs text-textMuted">
              Current available balance:{" "}
              <strong className="text-textMain">
                {fmtINR(userDetails?.wallet?.availableBalance)}
              </strong>
            </p>
            <form onSubmit={handleAdjustWallet} className="space-y-3">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Type *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("CREDIT")}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                      adjustType === "CREDIT"
                        ? "bg-green-600 text-white border-green-600"
                        : "border-borderSubtle text-textMuted"
                    }`}
                  >
                    + Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEBIT")}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                      adjustType === "DEBIT"
                        ? "bg-red-600 text-white border-red-600"
                        : "border-borderSubtle text-textMuted"
                    }`}
                  >
                    − Debit
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Refund for duplicate payment"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {isProcessing ? "Adjusting..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">
              Change Role — {userDetails?.user.name}
            </h3>
            <p className="text-xs text-textMuted">
              Current role: <strong className="text-textMain">{userDetails?.user.role}</strong>
            </p>
            <form onSubmit={handleChangeRole} className="space-y-3">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">New Role *</label>
                <select
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                >
                  <option value="user">User</option>
                  <option value="content_admin">Content Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="work_admin">Work Admin</option>
                </select>
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Reason *</label>
                <input
                  type="text"
                  required
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  placeholder="e.g. Promoted to manage work listings"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {isProcessing ? "Updating..." : "Confirm Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">
              Reset Password — {userDetails?.user.name}
            </h3>
            <p className="text-xs text-textMuted">
              The user will be signed out of all devices and must log in with the new password.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">New Password * (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  placeholder="New temporary password"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-textMain">Reason *</label>
                <input
                  type="text"
                  required
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="e.g. User forgot password"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {isProcessing ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </form>
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