"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  BookOpen,
  TrendingUp,
  Activity,
  Award,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  UserPlus,
  Send,
  Loader2,
  Download,
  FileText,
  AlertCircle,
  Briefcase,
  MessageSquare,
  Eye,
  RefreshCcw,
  Calendar,
  IndianRupee,
  Target,
  Layers,
  Ban,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

type TabKey =
  | "overview"
  | "courses"
  | "work"
  | "payments"
  | "affiliate"
  | "referrals"
  | "kyc"
  | "support"
  | "audit";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Users },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "work", label: "Work", icon: Briefcase },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "affiliate", label: "Affiliate", icon: TrendingUp },
  { key: "referrals", label: "Referrals", icon: Users },
  { key: "kyc", label: "KYC", icon: ShieldCheck },
  { key: "support", label: "Support", icon: MessageSquare },
  { key: "audit", label: "Audit", icon: Activity },
];

type UserDetails = {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    referralCode: string;
    referredBy: string | null;
    avatarUrl: string | null;
    bio: string | null;
    phone: string | null;
    skills: string[];
    positionId: string | null;
    cvStatus: string;
    cvRemarks: string | null;
    cvReviewedAt: number | null;
    createdAt: number;
  };
  wallet: any;
  enrolledPrograms: any[];
  referralsCount: number;
  referralDetails: any[];
  affiliateStats: any;
  affiliateSales: any[];
  walletTransactions: any[];
  withdrawals: any[];
  applications: any[];
  certificates: any[];
  achievements: any[];
  achievementsCount: number;
  supportTickets: any[];
  auditLogs: any[];
  notificationsCount: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────

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

function fmtDateTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  available: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  requested: "bg-amber-100 text-amber-800",
  under_review: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-700",
  revoked: "bg-red-100 text-red-800",
};

const PIE_COLORS = ["#176B4D", "#D97706", "#2563EB", "#DC2626", "#7C3AED", "#0891B2"];

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
        STATUS_COLORS[value] || "bg-neutral-100 text-neutral-600"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: any;
  accent?: string;
}) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400" />}
      </div>
      <strong className={`text-sm font-extrabold ${accent || "text-textMain"}`}>
        {value}
      </strong>
    </div>
  );
}

// ── Export helpers ──────────────────────────────────────────────────────────

function exportCsv(header: string, rows: string[][], filename: string) {
  const csv = [header.split(","), ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(
  title: string,
  content: string[],
  filename: string
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, 14, 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  let y = 32;
  for (const line of content) {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, 14, y);
    y += 6;
  }
  pdf.save(filename);
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params?.userId as string) || "";
  const { token } = useAdminAuth();

  const data: UserDetails | undefined = useQuery(
    api.users.getUserDetails,
    token && userId ? { token, userId: userId as any } : "skip"
  );

  const plans = useQuery(api.plans.getAllPlansAdmin, token ? { token } : "skip");

  // Mutations
  const updateStatus = useMutation(api.users.updateUserStatus);
  const grantPlanAccess = useMutation(api.users.grantPlanAccess);
  const sendNotification = useMutation(api.users.sendAdminNotification);
  const adjustWallet = useMutation(api.wallets.adminAdjustWallet);
  const resetPassword = useMutation(api.users.adminResetPassword);
  const updateRole = useMutation(api.users.updateUserRole);
  const revokeProgramAccess = useMutation(api.users.revokeProgramAccess);

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dateRange, setDateRange] = useState(30);
  const [actionMsg, setActionMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal state
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [grantPlanOpen, setGrantPlanOpen] = useState(false);
  const [grantPlanId, setGrantPlanId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAmt, setWalletAmt] = useState("");
  const [walletType, setWalletType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [walletReason, setWalletReason] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPass, setResetPass] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeProgramId, setRevokeProgramId] = useState("");
  const [revokeProgramName, setRevokeProgramName] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  // Date-filtered data
  const rangeStart = useMemo(() => Date.now() - dateRange * 24 * 60 * 60 * 1000, [dateRange]);

  const filteredSales = useMemo(
    () => (data?.affiliateSales || []).filter((s: any) => s.createdAt >= rangeStart),
    [data?.affiliateSales, rangeStart]
  );

  const filteredWithdrawals = useMemo(
    () => (data?.withdrawals || []).filter((w: any) => w.createdAt >= rangeStart),
    [data?.withdrawals, rangeStart]
  );

  const filteredTxns = useMemo(
    () => (data?.walletTransactions || []).filter((t: any) => t.createdAt >= rangeStart),
    [data?.walletTransactions, rangeStart]
  );

  const filteredApps = useMemo(
    () => (data?.applications || []).filter((a: any) => a.submittedAt >= rangeStart),
    [data?.applications, rangeStart]
  );

  // Affiliate chart data
  const affiliateChartData = useMemo(() => {
    const byDate: Record<string, { sales: number; commission: number }> = {};
    for (const s of filteredSales) {
      const day = new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!byDate[day]) byDate[day] = { sales: 0, commission: 0 };
      byDate[day].sales += s.saleAmount || 0;
      byDate[day].commission += s.commissionAmount || 0;
    }
    return Object.entries(byDate)
      .map(([date, v]) => ({ date, ...v }))
      .slice(-14);
  }, [filteredSales]);

  const referralStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of data?.referralDetails || []) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data?.referralDetails]);

  // ── Action handlers ──────────────────────────────────────────────────

  const handleSuspend = async () => {
    if (!token || !userId) return;
    setIsProcessing(true);
    try {
      const newStatus = data?.user.status === "active" ? "suspended" : "active";
      await updateStatus({
        token,
        userId: userId as any,
        status: newStatus,
        reason: suspendReason || `Admin toggled to ${newStatus}`,
      });
      setActionMsg(`Account ${newStatus}. User has been notified.`);
      setSuspendOpen(false);
      setSuspendReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrantPlan = async () => {
    if (!token || !userId || !grantPlanId) return;
    setIsProcessing(true);
    try {
      const res = await grantPlanAccess({
        token,
        userId: userId as any,
        planId: grantPlanId as any,
        reason: grantReason || "Admin plan grant",
      });
      setActionMsg(`Granted ${res.grantedCount} courses. User has been notified.`);
      setGrantPlanOpen(false);
      setGrantReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotify = async () => {
    if (!token || !userId || !notifyTitle || !notifyMsg) return;
    setIsProcessing(true);
    try {
      await sendNotification({
        token,
        userId: userId as any,
        title: notifyTitle,
        message: notifyMsg,
      });
      setActionMsg("Notification sent to user.");
      setNotifyOpen(false);
      setNotifyTitle("");
      setNotifyMsg("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWallet = async () => {
    if (!token || !userId || !walletAmt || !walletReason) return;
    setIsProcessing(true);
    try {
      const amt = parseFloat(walletAmt);
      if (!isFinite(amt) || amt <= 0) throw new Error("Enter valid amount");
      const res = await adjustWallet({
        token,
        userId: userId as any,
        amount: amt,
        type: walletType,
        reason: walletReason,
      });
      setActionMsg(`Wallet adjusted. New balance: ${fmtINR(res.newBalance)}`);
      setWalletOpen(false);
      setWalletAmt("");
      setWalletReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!token || !userId || !resetPass || !resetReason) return;
    setIsProcessing(true);
    try {
      await resetPassword({
        token,
        userId: userId as any,
        newPassword: resetPass,
        reason: resetReason,
      });
      setActionMsg("Password reset. All sessions invalidated.");
      setResetOpen(false);
      setResetPass("");
      setResetReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    if (!token || !userId || !revokeProgramId || !revokeReason) return;
    setIsProcessing(true);
    try {
      await revokeProgramAccess({
        token,
        userId: userId as any,
        programId: revokeProgramId as any,
        reason: revokeReason,
      });
      setActionMsg(`Access to "${revokeProgramName}" revoked.`);
      setRevokeOpen(false);
      setRevokeProgramId("");
      setRevokeProgramName("");
      setRevokeReason("");
    } catch (err: any) {
      setActionMsg(err.message || "Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── CSV/PDF exports ──────────────────────────────────────────────────

  const exportUserCsv = () => {
    if (!data) return;
    const u = data.user;
    const header = "Field,Value";
    const rows = [
      ["Name", u.name],
      ["Email", u.email],
      ["Role", u.role],
      ["Status", u.status],
      ["Phone", u.phone || ""],
      ["Referral Code", u.referralCode],
      ["Joined", fmtDate(u.createdAt)],
      ["Wallet Balance", String(data.wallet?.availableBalance || 0)],
      ["Total Earned", String(data.wallet?.totalEarned || 0)],
      ["Enrolled Programs", String(data.enrolledPrograms.length)],
      ["Referrals", String(data.referralsCount)],
      ["Affiliate Commission", String(data.affiliateStats?.commissionEarned || 0)],
      ["Achievements", String(data.achievementsCount)],
    ];
    exportCsv(header, rows, `user-${u.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportUserPdf = async () => {
    if (!data) return;
    const u = data.user;
    const lines = [
      `Name: ${u.name}`,
      `Email: ${u.email}`,
      `Role: ${u.role}`,
      `Status: ${u.status}`,
      `Phone: ${u.phone || "N/A"}`,
      `Referral Code: ${u.referralCode}`,
      `Joined: ${fmtDate(u.createdAt)}`,
      "",
      "--- Financial Summary ---",
      `Wallet Balance: ${fmtINR(data.wallet?.availableBalance)}`,
      `Total Earned: ${fmtINR(data.wallet?.totalEarned)}`,
      `Affiliate Commission Earned: ${fmtINR(data.affiliateStats?.commissionEarned)}`,
      `Pending Commission: ${fmtINR(data.affiliateStats?.pendingCommission)}`,
      "",
      "--- Enrollment ---",
      `Programs Enrolled: ${data.enrolledPrograms.length}`,
      ...data.enrolledPrograms.map(
        (p: any) => `  - ${p.program?.name || "Unknown"} (${p.purchase?.status})`
      ),
      "",
      "--- Referrals ---",
      `Total Referrals: ${data.referralsCount}`,
      `Conversion Rate: ${data.affiliateStats?.conversionRate || 0}%`,
      ...data.referralDetails.slice(0, 20).map(
        (r: any) => `  - ${r.name} (${r.email}) - ${r.status} - ${fmtDate(r.createdAt)}`
      ),
      "",
      "--- Support Tickets ---",
      ...(data.supportTickets || []).map(
        (t: any) => `  [${t.status}] ${t.subject} (${fmtDate(t.createdAt)})`
      ),
    ];
    await exportPdf(`User Report: ${u.name}`, lines, `user-${u.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── Loading / not found ──────────────────────────────────────────────

  if (data === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="flex gap-6">
          <div className="w-72 h-96 bg-neutral-200 rounded-xl" />
          <div className="flex-1 h-96 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 space-y-3">
        <Users className="w-10 h-10 text-neutral-300 mx-auto" />
        <p className="text-sm font-semibold">User not found</p>
        <Link href="/users" className="btn-primary text-xs inline-flex">
          Back to Users
        </Link>
      </div>
    );
  }

  const u = data.user;
  const isSuspended = u.status === "suspended";

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/users")}
            className="p-2 rounded-lg hover:bg-neutral-100 text-textMuted"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-textMain">
                {u.name}
              </h1>
              <StatusBadge value={u.status} />
              <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 uppercase">
                {u.role.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-textMuted mt-0.5">
              {u.email} · Joined {fmtDate(u.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
            <option value={99999}>All time</option>
          </select>
          <button
            onClick={exportUserCsv}
            className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={exportUserPdf}
            className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {actionMsg}
          <button onClick={() => setActionMsg("")} className="ml-auto">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left sidebar ─────────────────────────────────────── */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          {/* User card */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-lg shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-textMain truncate">{u.name}</p>
                <p className="text-[11px] text-textMuted truncate">{u.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <StatCard label="Wallet" value={fmtINR(data.wallet?.availableBalance)} icon={Wallet} accent="text-brand-700" />
              <StatCard label="Earned" value={fmtINR(data.wallet?.totalEarned)} icon={IndianRupee} accent="text-brand-700" />
              <StatCard label="Enrolled" value={`${data.enrolledPrograms.length}`} icon={BookOpen} />
              <StatCard label="Referrals" value={`${data.referralsCount}`} icon={Users} />
            </div>

            {u.phone && (
              <div className="flex items-center gap-2 text-xs text-textMuted">
                <Phone className="w-3.5 h-3.5" /> {u.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-textMuted">
              <Mail className="w-3.5 h-3.5" /> {u.email}
            </div>
            <div className="flex items-center gap-2 text-xs text-textMuted">
              <Target className="w-3.5 h-3.5" /> Code: <strong className="font-mono">{u.referralCode}</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="card-surface p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted mb-2">
              Actions
            </p>
            <button
              onClick={() => setGrantPlanOpen(true)}
              className="w-full btn-primary text-[11px] py-2 flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> Assign Plan
            </button>
            <button
              onClick={() => setNotifyOpen(true)}
              className="w-full btn-secondary text-[11px] py-2 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send Notification
            </button>
            <button
              onClick={() => setWalletOpen(true)}
              className="w-full btn-secondary text-[11px] py-2 flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" /> Adjust Wallet
            </button>
            <button
              onClick={() => setResetOpen(true)}
              className="w-full btn-secondary text-[11px] py-2 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset Password
            </button>
            <button
              onClick={() => setSuspendOpen(true)}
              className={`w-full btn-secondary text-[11px] py-2 flex items-center justify-center gap-1.5 ${
                isSuspended ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"
              }`}
            >
              {isSuspended ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Activate Account</>
              ) : (
                <><ShieldAlert className="w-3.5 h-3.5" /> Suspend Account</>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-borderSubtle pb-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
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

          {/* ── Tab content ────────────────────────────────────── */}
          <div className="card-surface p-6">
            {activeTab === "overview" && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-textMain">Account Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Wallet Balance" value={fmtINR(data.wallet?.availableBalance)} accent="text-brand-700" />
                  <StatCard label="Total Earned" value={fmtINR(data.wallet?.totalEarned)} accent="text-brand-700" />
                  <StatCard label="Affiliate Commission" value={fmtINR(data.affiliateStats?.commissionEarned)} accent="text-brand-700" />
                  <StatCard label="Pending Commission" value={fmtINR(data.affiliateStats?.pendingCommission)} accent="text-amber-600" />
                  <StatCard label="Enrolled Programs" value={`${data.enrolledPrograms.length}`} />
                  <StatCard label="Certificates" value={`${data.certificates.length}`} />
                  <StatCard label="Referrals" value={`${data.referralsCount}`} />
                  <StatCard label="Conversion Rate" value={`${data.affiliateStats?.conversionRate || 0}%`} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">CV Status</span>
                    <StatusBadge value={u.cvStatus} />
                    {u.cvRemarks && <p className="text-textMuted mt-1">{u.cvRemarks}</p>}
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Skills</span>
                    <p className="text-textMain">{u.skills?.length ? u.skills.join(", ") : "None listed"}</p>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-textMain">Recent Activity</h3>
                  {(data.auditLogs || []).slice(0, 5).map((log: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-textMuted py-1.5 border-b border-borderSubtle last:border-0">
                      <Activity className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-textMain">{log.action.replace(/_/g, " ")}</span>
                        {log.reason && <span> — {log.reason}</span>}
                        <span className="ml-1 text-neutral-400">{fmtDateTime(log.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  {(!data.auditLogs || data.auditLogs.length === 0) && (
                    <p className="text-xs text-textMuted">No activity recorded.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "courses" && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-textMain">Enrolled Programs ({data.enrolledPrograms.length})</h2>
                {data.enrolledPrograms.length === 0 ? (
                  <p className="text-xs text-textMuted">No programs enrolled.</p>
                ) : (
                  <div className="space-y-2">
                    {data.enrolledPrograms.map((ep: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-textMain">{ep.program?.name || "Unknown"}</p>
                          <p className="text-[10px] text-textMuted">
                            {ep.purchase?.accessType === "admin_grant" ? "Admin grant" : `Paid ${fmtINR(ep.purchase?.amount)}`}
                            {" · "}{fmtDate(ep.purchase?.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge value={ep.purchase?.status || "unknown"} />
                          {ep.purchase?.status === "completed" && (
                            <button
                              onClick={() => {
                                setRevokeProgramId(ep.program?._id);
                                setRevokeProgramName(ep.program?.name || "Unknown");
                                setRevokeReason("");
                                setRevokeOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Revoke access"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "work" && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-textMain">Work Applications ({filteredApps.length})</h2>
                {filteredApps.length === 0 ? (
                  <p className="text-xs text-textMuted">No work applications in this range.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredApps.map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
                        <div>
                          <p className="text-xs font-bold text-textMain">{a.jobTitle}</p>
                          <p className="text-[10px] text-textMuted">{fmtDate(a.submittedAt)}</p>
                        </div>
                        <StatusBadge value={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-textMain">Wallet Transactions ({filteredTxns.length})</h2>
                {filteredTxns.length === 0 ? (
                  <p className="text-xs text-textMuted">No transactions in this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-borderSubtle text-textMuted">
                          <th className="py-2 px-3 text-left font-semibold">Date</th>
                          <th className="py-2 px-3 text-left font-semibold">Type</th>
                          <th className="py-2 px-3 text-right font-semibold">Amount</th>
                          <th className="py-2 px-3 text-left font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borderSubtle">
                        {filteredTxns.map((t: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 px-3 text-textMuted">{fmtDate(t.createdAt)}</td>
                            <td className="py-2 px-3"><StatusBadge value={t.type || "credit"} /></td>
                            <td className={`py-2 px-3 text-right font-bold ${t.type === "debit" ? "text-red-600" : "text-green-700"}`}>
                              {t.type === "debit" ? "-" : "+"}{fmtINR(t.amount)}
                            </td>
                            <td className="py-2 px-3 text-textMuted">{t.description || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredWithdrawals.length > 0 && (
                  <>
                    <h3 className="text-xs font-bold text-textMain pt-4 border-t border-borderSubtle">
                      Withdrawals ({filteredWithdrawals.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredWithdrawals.map((w: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
                          <div>
                            <p className="text-xs font-bold text-textMain">{fmtINR(w.amount)}</p>
                            <p className="text-[10px] text-textMuted">{fmtDate(w.createdAt)} · {w.method || "bank"}</p>
                          </div>
                          <StatusBadge value={w.status} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "affiliate" && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-textMain">Affiliate Performance</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Total Referrals" value={`${data.affiliateStats?.totalReferrals || 0}`} />
                  <StatCard label="Converted" value={`${data.affiliateStats?.convertedReferrals || 0}`} />
                  <StatCard label="Conversion Rate" value={`${data.affiliateStats?.conversionRate || 0}%`} />
                  <StatCard label="Commission Earned" value={fmtINR(data.affiliateStats?.commissionEarned)} accent="text-brand-700" />
                </div>

                {affiliateChartData.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-textMain">Sales & Commission ({dateRange === 99999 ? "All time" : `${dateRange}d`})</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={affiliateChartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke="#E5E5E5" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#737373" }} />
                        <Tooltip formatter={(v: any) => fmtINR(v)} />
                        <Bar dataKey="sales" name="Sale Amount" fill="#176B4D" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="commission" name="Commission" fill="#D97706" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-textMain">Sales History ({filteredSales.length})</h3>
                  {filteredSales.length === 0 ? (
                    <p className="text-xs text-textMuted">No sales in this range.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-borderSubtle text-textMuted">
                            <th className="py-2 px-3 text-left font-semibold">Date</th>
                            <th className="py-2 px-3 text-left font-semibold">Buyer</th>
                            <th className="py-2 px-3 text-left font-semibold">Program</th>
                            <th className="py-2 px-3 text-right font-semibold">Sale</th>
                            <th className="py-2 px-3 text-right font-semibold">Commission</th>
                            <th className="py-2 px-3 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-borderSubtle">
                          {filteredSales.map((s: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 px-3 text-textMuted">{fmtDate(s.createdAt)}</td>
                              <td className="py-2 px-3 font-semibold text-textMain">{s.buyerName}</td>
                              <td className="py-2 px-3 text-textMuted">{s.programName}</td>
                              <td className="py-2 px-3 text-right font-bold">{fmtINR(s.saleAmount)}</td>
                              <td className="py-2 px-3 text-right font-bold text-brand-700">{fmtINR(s.commissionAmount)}</td>
                              <td className="py-2 px-3"><StatusBadge value={s.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-textMain">Referral Network ({data.referralDetails.length})</h2>
                {referralStatusData.length > 0 && (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={referralStatusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                          {referralStatusData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {referralStatusData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-textMuted">{d.name}</span>
                          <strong className="text-textMain">{d.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.referralDetails.length === 0 ? (
                  <p className="text-xs text-textMuted">No referrals yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-borderSubtle text-textMuted">
                          <th className="py-2 px-3 text-left font-semibold">Name</th>
                          <th className="py-2 px-3 text-left font-semibold">Email</th>
                          <th className="py-2 px-3 text-left font-semibold">Status</th>
                          <th className="py-2 px-3 text-left font-semibold">Purchased</th>
                          <th className="py-2 px-3 text-left font-semibold">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borderSubtle">
                        {data.referralDetails.map((r: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-semibold text-textMain">{r.name}</td>
                            <td className="py-2 px-3 text-textMuted">{r.email}</td>
                            <td className="py-2 px-3"><StatusBadge value={r.status} /></td>
                            <td className="py-2 px-3">{r.hasPurchase ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-neutral-300" />}</td>
                            <td className="py-2 px-3 text-textMuted">{fmtDate(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "kyc" && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-textMain">KYC Information</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">CV Status</span>
                    <div className="mt-1"><StatusBadge value={u.cvStatus} /></div>
                  </div>
                  {u.cvReviewedAt && (
                    <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Reviewed</span>
                      <p className="mt-1 font-semibold text-textMain">{fmtDate(u.cvReviewedAt)}</p>
                    </div>
                  )}
                  {u.cvRemarks && (
                    <div className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle col-span-2 sm:col-span-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Remarks</span>
                      <p className="mt-1 text-textMain">{u.cvRemarks}</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-textMuted">
                  Full KYC details are managed on the{" "}
                  <Link href="/kyc" className="text-brand-700 hover:underline font-semibold">
                    KYC Verification
                  </Link>{" "}
                  page.
                </p>
              </div>
            )}

            {activeTab === "support" && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-textMain">Support Tickets ({(data.supportTickets || []).length})</h2>
                {(!data.supportTickets || data.supportTickets.length === 0) ? (
                  <p className="text-xs text-textMuted">No support tickets.</p>
                ) : (
                  <div className="space-y-2">
                    {data.supportTickets.map((t: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-borderSubtle">
                        <div>
                          <p className="text-xs font-bold text-textMain">{t.subject}</p>
                          <p className="text-[10px] text-textMuted">
                            #{t.ticketId} · {fmtDate(t.createdAt)}
                          </p>
                        </div>
                        <StatusBadge value={t.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-textMain">Audit Trail ({(data.auditLogs || []).length})</h2>
                {(!data.auditLogs || data.auditLogs.length === 0) ? (
                  <p className="text-xs text-textMuted">No audit entries.</p>
                ) : (
                  <div className="space-y-2">
                    {data.auditLogs.map((log: any, i: number) => (
                      <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-textMain">{log.action.replace(/_/g, " ")}</span>
                          <span className="text-textMuted">{fmtDateTime(log.timestamp)}</span>
                        </div>
                        {log.adminEmail && (
                          <p className="text-textMuted">by {log.adminEmail}</p>
                        )}
                        {log.reason && <p className="text-textMuted">Reason: {log.reason}</p>}
                        {log.previousValue && log.newValue && (
                          <p className="text-textMuted">
                            Changed from <strong>{String(log.previousValue)}</strong> to <strong>{String(log.newValue)}</strong>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}

      {/* Suspend / Activate */}
      {suspendOpen && (
        <Modal title={isSuspended ? "Activate Account" : "Suspend Account"} onClose={() => setSuspendOpen(false)}>
          <p className="text-xs text-textMuted mb-3">
            {isSuspended
              ? "This will reactivate the account and restore access."
              : "This will immediately log the user out and block access."}
          </p>
          <textarea
            rows={2}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason (shown to user)..."
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <button
            onClick={handleSuspend}
            disabled={isProcessing}
            className={`w-full py-2 rounded-lg text-xs font-bold text-white ${
              isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            } disabled:opacity-50`}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isSuspended ? "Activate" : "Suspend"}
          </button>
        </Modal>
      )}

      {/* Grant Plan */}
      {grantPlanOpen && (
        <Modal title="Assign Plan to User" onClose={() => setGrantPlanOpen(false)}>
          <p className="text-xs text-textMuted mb-3">
            Grant access to all courses inside a plan for free. The user will be notified.
          </p>
          <select
            value={grantPlanId}
            onChange={(e) => setGrantPlanId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          >
            <option value="">Select a plan...</option>
            {(plans || []).map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.name} — {fmtINR(p.price)} ({(p.programIds || []).length} courses)
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            placeholder="Reason..."
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <button
            onClick={handleGrantPlan}
            disabled={isProcessing || !grantPlanId}
            className="w-full btn-primary py-2 text-xs disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Grant Plan Access"}
          </button>
        </Modal>
      )}

      {/* Send Notification */}
      {notifyOpen && (
        <Modal title="Send Notification" onClose={() => setNotifyOpen(false)}>
          <input
            value={notifyTitle}
            onChange={(e) => setNotifyTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <textarea
            rows={3}
            value={notifyMsg}
            onChange={(e) => setNotifyMsg(e.target.value)}
            placeholder="Message..."
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <button
            onClick={handleNotify}
            disabled={isProcessing || !notifyTitle || !notifyMsg}
            className="w-full btn-primary py-2 text-xs disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Notification"}
          </button>
        </Modal>
      )}

      {/* Adjust Wallet */}
      {walletOpen && (
        <Modal title="Adjust Wallet" onClose={() => setWalletOpen(false)}>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setWalletType("CREDIT")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                walletType === "CREDIT" ? "bg-green-100 border-green-300 text-green-800" : "border-borderSubtle text-textMuted"
              }`}
            >
              Credit (+)
            </button>
            <button
              onClick={() => setWalletType("DEBIT")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                walletType === "DEBIT" ? "bg-red-100 border-red-300 text-red-800" : "border-borderSubtle text-textMuted"
              }`}
            >
              Debit (-)
            </button>
          </div>
          <input
            type="number"
            value={walletAmt}
            onChange={(e) => setWalletAmt(e.target.value)}
            placeholder="Amount"
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <textarea
            rows={2}
            value={walletReason}
            onChange={(e) => setWalletReason(e.target.value)}
            placeholder="Reason..."
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <button
            onClick={handleWallet}
            disabled={isProcessing || !walletAmt || !walletReason}
            className="w-full btn-primary py-2 text-xs disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Adjust Wallet"}
          </button>
        </Modal>
      )}

      {/* Reset Password */}
      {resetOpen && (
        <Modal title="Reset Password" onClose={() => setResetOpen(false)}>
          <p className="text-xs text-textMuted mb-3">All active sessions will be invalidated.</p>
          <input
            type="password"
            value={resetPass}
            onChange={(e) => setResetPass(e.target.value)}
            placeholder="New password"
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <textarea
            rows={2}
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            placeholder="Reason..."
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <button
            onClick={handleReset}
            disabled={isProcessing || !resetPass || !resetReason}
            className="w-full btn-primary py-2 text-xs disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Reset Password"}
          </button>
        </Modal>
      )}

      {revokeOpen && (
        <Modal title="Revoke Program Access" onClose={() => setRevokeOpen(false)}>
          <p className="text-xs text-textMuted mb-1">
            Revoke <span className="font-bold text-red-600">{revokeProgramName}</span> from this user?
          </p>
          <p className="text-[10px] text-textMuted mb-3">Their certificates for this program will also be removed.</p>
          <textarea
            rows={2}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Reason for revocation..."
            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white mb-3"
          />
          <button
            onClick={handleRevoke}
            disabled={isProcessing || !revokeReason}
            className="w-full py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Revoke Access"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Reusable modal shell ────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textMain">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-textMuted">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
