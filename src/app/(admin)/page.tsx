"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import {
  Users,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  IndianRupee,
  Receipt,
  Percent,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Target,
  ShoppingCart,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  DollarSign,
  BarChart3,
  CreditCard,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
} from "recharts";

// ── Professional color palette ──────────────────────────────────────────────

const COLORS = {
  brand: "#176B4D",
  brandLight: "#22c55e",
  brandDark: "#0f4430",
  amber: "#D97706",
  amberLight: "#F59E0B",
  red: "#DC2626",
  redLight: "#EF4444",
  blue: "#2563EB",
  blueLight: "#3B82F6",
  purple: "#7C3AED",
  cyan: "#0891B2",
  neutral: "#6B7280",
  neutralLight: "#9CA3AF",
  grid: "#F3F4F6",
  gridDark: "#E5E7EB",
};

const GRADIENTS = {
  brand: "from-emerald-500 to-emerald-600",
  brandSubtle: "from-emerald-50 to-emerald-100/50",
  blue: "from-blue-500 to-blue-600",
  blueSubtle: "from-blue-50 to-blue-100/50",
  amber: "from-amber-500 to-amber-600",
  amberSubtle: "from-amber-50 to-amber-100/50",
  red: "from-red-500 to-red-600",
  redSubtle: "from-red-50 to-red-100/50",
  purple: "from-purple-500 to-purple-600",
  purpleSubtle: "from-purple-50 to-purple-100/50",
};

const RANGES: [number, string][] = [
  [7, "7D"],
  [30, "30D"],
  [90, "90D"],
  [365, "1Y"],
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtRs(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDay(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function rangeCaption(days: number): string {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const opts = { day: "numeric", month: "short" } as const;
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString(
    "en-IN",
    opts
  )}`;
}

// ── Professional Components ─────────────────────────────────────────────────

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null)
    return <span className="text-[10px] text-neutral-400">N/A</span>;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        up
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-1 ring-red-200"
      }`}
    >
      {up ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function PremiumKpiCard({
  label,
  value,
  icon: Icon,
  sub,
  badge,
  gradient,
  iconBg,
}: {
  label: string;
  value: string;
  icon: any;
  sub?: React.ReactNode;
  badge?: React.ReactNode;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Gradient accent top */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {label}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-2xl font-extrabold tracking-tight text-neutral-900">
              {value}
            </p>
            {badge}
          </div>
          {sub && (
            <div className="text-[11px] text-neutral-500 leading-relaxed">
              {sub}
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  icon?: any;
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-neutral-500" />
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
        {hint && <p className="text-[11px] text-neutral-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-neutral-200 to-transparent" />
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function ProfessionalTooltip() {
  return (
    <Tooltip
      formatter={(value: any, name: any) =>
        String(name) === "Daily signups" || String(name) === "Total users"
          ? [Number(value).toLocaleString("en-IN"), name]
          : [fmtRs(Number(value)), name]
      }
      labelFormatter={(l: any) => fmtDay(String(l))}
      contentStyle={{
        borderRadius: 12,
        border: "none",
        fontSize: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        padding: "10px 14px",
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(8px)",
      }}
      itemStyle={{ padding: "2px 0" }}
    />
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { token } = useAdminAuth();
  const [days, setDays] = useState(30);

  const data: any = useQuery(
    api.analyticsAdmin.getDashboardAnalytics,
    token ? { token, days } : "skip"
  );

  const k = data?.kpis;
  const s = data?.series;
  const f = data?.funnel;
  const p = data?.platform;

  const attentionItems: { href: string; text: React.ReactNode; severity: "warning" | "danger" }[] =
    data === undefined
      ? []
      : [
          ...(p.pendingWithdrawalsCount > 0
            ? [
                {
                  href: "/finance",
                  severity: "warning" as const,
                  text: (
                    <>
                      <strong>{p.pendingWithdrawalsCount}</strong> withdrawal
                      {p.pendingWithdrawalsCount === 1 ? "" : "s"} awaiting review —{" "}
                      <strong>{fmtRs(p.pendingWithdrawalAmount)}</strong> to release
                    </>
                  ),
                },
              ]
            : []),
          ...(f.cancelled + f.failed > 0
            ? [
                {
                  href: "/payments",
                  severity: "warning" as const,
                  text: (
                    <>
                      <strong>{f.cancelled + f.failed}</strong> checkout
                      {f.cancelled + f.failed === 1 ? "" : "s"} dropped — worth investigating
                    </>
                  ),
                },
              ]
            : []),
          ...(k.profitAfterTax < 0
            ? [
                {
                  href: "/expenses",
                  severity: "danger" as const,
                  text: (
                    <>
                      Expenses exceeded revenue — profit is{" "}
                      <strong className="text-red-600">{fmtRs(k.profitAfterTax)}</strong>
                    </>
                  ),
                },
              ]
            : []),
        ];

  // Compute max for funnel bars
  const funnelMax = Math.max(f?.attempts || 0, 1);

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
              Dashboard
            </h1>
          </div>
          <p className="text-[12px] text-neutral-400 pl-11">
            {data === undefined
              ? "Loading live data..."
              : `${rangeCaption(days)} · ${days === 365 ? "last 12 months" : `last ${days} days`}`}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl p-1">
          {RANGES.map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                days === d
                  ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {data !== undefined && attentionItems.length > 0 && (
        <div className="space-y-2">
          {attentionItems.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                a.severity === "danger"
                  ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                  : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  a.severity === "danger" ? "bg-red-100" : "bg-amber-100"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${
                    a.severity === "danger" ? "text-red-600" : "text-amber-600"
                  }`}
                />
              </div>
              <span className="flex-1 text-[12px] font-medium">{a.text}</span>
              <ArrowRight className="w-4 h-4 shrink-0 opacity-40" />
            </Link>
          ))}
        </div>
      )}
      {data !== undefined && attentionItems.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[12px] font-medium">
            All clear — no pending actions required.
          </span>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────── */}
      {data === undefined ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 bg-white p-5 animate-pulse">
                <div className="h-3 bg-neutral-100 rounded-full w-2/3 mb-3" />
                <div className="h-7 bg-neutral-100 rounded-full w-1/2 mb-2" />
                <div className="h-2 bg-neutral-100 rounded-full w-3/4" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 animate-pulse">
            <div className="h-64 bg-neutral-50 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* ── KPI Cards: Revenue ─────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              title="Revenue & Profitability"
              hint={`${days}d performance · all figures include GST where applicable`}
              icon={DollarSign}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <PremiumKpiCard
                label="Gross Collected"
                value={fmtRs(k.grossRevenue)}
                icon={IndianRupee}
                gradient={GRADIENTS.brand}
                iconBg="bg-emerald-50 text-emerald-600"
                badge={<GrowthBadge pct={k.revenueGrowthPct} />}
                sub={
                  <>
                    {k.orders} paid order{k.orders === 1 ? "" : "s"} · all-time{" "}
                    {fmtRs(k.allTimeGrossRevenue)}
                  </>
                }
              />
              <PremiumKpiCard
                label="Net of GST"
                value={fmtRs(k.netRevenue)}
                icon={Percent}
                gradient={GRADIENTS.blue}
                iconBg="bg-blue-50 text-blue-600"
                sub={
                  <>
                    minus {data.gst.label}{" "}
                    {data.gst.enabled ? `@${data.gst.rate}%` : "off"} (
                    {fmtRs(k.gstCollected)})
                  </>
                }
              />
              <PremiumKpiCard
                label="Operating Expenses"
                value={fmtRs(k.expenses)}
                icon={Receipt}
                gradient={GRADIENTS.amber}
                iconBg="bg-amber-50 text-amber-600"
                sub={
                  <Link
                    href="/expenses"
                    className="text-emerald-600 hover:underline font-semibold"
                  >
                    manage expenses →
                  </Link>
                }
              />
              <PremiumKpiCard
                label="Net Profit"
                value={fmtRs(k.profitAfterTax)}
                icon={Wallet}
                gradient={k.profitAfterTax >= 0 ? GRADIENTS.brand : GRADIENTS.red}
                iconBg={
                  k.profitAfterTax >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }
                sub={
                  <>
                    after {fmtRs(data.taxRatePct)}% tax on PBT {fmtRs(k.profitBeforeTax)}
                  </>
                }
              />
            </div>
          </section>

          {/* ── KPI Cards: Customers ──────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              title="Customers & Conversion"
              hint="acquisition, conversion and average order metrics"
              icon={Users}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <PremiumKpiCard
                label="Total Users"
                value={String(k.totalUsers)}
                icon={Users}
                gradient={GRADIENTS.purple}
                iconBg="bg-purple-50 text-purple-600"
                badge={<GrowthBadge pct={k.signupsGrowthPct} />}
                sub={
                  <>
                    {p.activeUsers} active · +{k.signupsInRange} joined in {days}d
                  </>
                }
              />
              <PremiumKpiCard
                label="Checkout Conversion"
                value={`${k.conversionPct.toFixed(1)}%`}
                icon={Target}
                gradient={GRADIENTS.blue}
                iconBg="bg-blue-50 text-blue-600"
                sub={
                  <>
                    {f.paid} paid of {f.attempts} attempts
                  </>
                }
              />
              <PremiumKpiCard
                label="Avg Order Value"
                value={fmtRs(k.avgOrderValue || 0)}
                icon={ShoppingCart}
                gradient={GRADIENTS.brand}
                iconBg="bg-emerald-50 text-emerald-600"
                sub={<>per paid order, incl. GST</>}
              />
              <PremiumKpiCard
                label="Revenue Per User"
                value={fmtRs(k.arpu || 0)}
                icon={UserPlus}
                gradient={GRADIENTS.amber}
                iconBg="bg-amber-50 text-amber-600"
                sub={<>all-time collected / all users</>}
              />
            </div>
          </section>

          {/* ── Charts Row: Signups + Revenue ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signups Chart */}
            <ChartCard
              title="User Growth"
              subtitle="Daily registrations vs cumulative user base"
              actions={
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-neutral-400">Today:</span>
                  <span className="font-bold text-emerald-600">+{k.newToday}</span>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={s.signups}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke={COLORS.grid}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDay}
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="l"
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="r"
                    orientation="right"
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ProfessionalTooltip />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    yAxisId="l"
                    dataKey="signups"
                    name="Daily signups"
                    fill={COLORS.brand}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                  <Line
                    yAxisId="r"
                    dataKey="cumulative"
                    name="Total users"
                    stroke={COLORS.blue}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Revenue Chart */}
            <ChartCard
              title="Revenue Trend"
              subtitle="Daily collections with cumulative running total"
              actions={
                <div className="text-right text-[11px]">
                  <p className="text-neutral-400">This range</p>
                  <p className="font-bold text-neutral-900">{fmtRs(k.grossRevenue)}</p>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={s.revenue}
                  margin={{ top: 4, right: 8, left: -4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke={COLORS.grid}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDay}
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="l"
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    tickFormatter={(v) => fmtRs(v, true)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="r"
                    orientation="right"
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    tickFormatter={(v) => fmtRs(v, true)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ProfessionalTooltip />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    yAxisId="l"
                    dataKey="revenue"
                    name="Daily revenue"
                    fill={COLORS.brand}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                  <Area
                    yAxisId="r"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke={COLORS.brand}
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Profitability + Expense Split ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profit Chart */}
            <ChartCard
              title="Revenue vs Expenses vs Profit"
              subtitle={`Costs, taxes and what remains (${data.gst.label}-excl, tax @${data.taxRatePct}%)`}
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                  data={s.profit}
                  margin={{ top: 4, right: 8, left: -4, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke={COLORS.grid}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDay}
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                    tickFormatter={(v) => fmtRs(v, true)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ProfessionalTooltip />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill={COLORS.brand}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill={COLORS.amber}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                  <Line
                    dataKey="profit"
                    name="Profit"
                    stroke={COLORS.blue}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Expense Split Pie */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Expense Split</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">by category</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
                  <PieIcon className="w-4 h-4 text-neutral-400" />
                </div>
              </div>
              {data.expensesByCategory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-2">No expenses recorded</p>
                  <Link
                    href="/expenses"
                    className="text-[11px] text-emerald-600 font-bold hover:underline"
                  >
                    + Add first expense
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={data.expensesByCategory}
                          dataKey="total"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {data.expensesByCategory.map((c: any, i: number) => (
                            <Cell key={i} fill={c.color} />
                          ))}
                        </Pie>
                        <ProfessionalTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5">
                    {data.expensesByCategory.slice(0, 5).map((c: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-2 text-neutral-600">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: c.color }}
                            />
                            {c.name}
                          </span>
                          <span className="font-bold text-neutral-900">{fmtRs(c.total)}</span>
                        </div>
                        <MiniBar
                          value={c.total}
                          max={Math.max(...data.expensesByCategory.map((e: any) => e.total))}
                          color="bg-neutral-300"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Best-Selling Plans + Funnel ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plans Chart */}
            <ChartCard
              title="Best-Selling Plans"
              subtitle="Revenue per plan in this range"
              className="lg:col-span-2"
            >
              {data.revenueByPlan.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-[11px] text-neutral-400">No paid orders in range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart
                    data={data.revenueByPlan}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke={COLORS.grid}
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: COLORS.neutralLight }}
                      tickFormatter={(v) => fmtRs(v, true)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: "#404040", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ProfessionalTooltip />
                    <Bar
                      dataKey="total"
                      name="Revenue"
                      fill={COLORS.brand}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={24}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Checkout Funnel */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Checkout Funnel</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {days}d · from Razorpay
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-neutral-400" />
                </div>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: "Reached checkout", value: f.attempts, color: "bg-blue-500", textColor: "text-blue-600" },
                  { label: "Paid", value: f.paid, color: "bg-emerald-500", textColor: "text-emerald-600" },
                  { label: "Cancelled / expired", value: f.cancelled, color: "bg-amber-500", textColor: "text-amber-600" },
                  { label: "Failed", value: f.failed, color: "bg-red-500", textColor: "text-red-600" },
                  { label: "Still pending", value: f.pending, color: "bg-neutral-300", textColor: "text-neutral-500" },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">{item.label}</span>
                      <span className="text-[11px] font-bold text-neutral-900">{item.value}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                        style={{
                          width: `${funnelMax > 0 ? (item.value / funnelMax) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Quick Actions ──────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              title="Quick Actions"
              hint="jump to areas that need attention"
              icon={Zap}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/finance"
                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:shadow-md ${
                  p.pendingWithdrawalsCount > 0
                    ? "border-amber-200 ring-1 ring-amber-100"
                    : "border-neutral-100"
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Pending Withdrawals
                    </p>
                    <p className="text-xl font-extrabold text-amber-600">
                      {fmtRs(p.pendingWithdrawalAmount)}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {p.pendingWithdrawalsCount} awaiting review
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </Link>

              <Link
                href="/work"
                className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 transition-all duration-300 hover:shadow-md"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Work Marketplace
                    </p>
                    <p className="text-xl font-extrabold text-neutral-900">
                      {p.activeJobs}
                    </p>
                    <p className="text-[11px] text-neutral-400">active jobs</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </Link>

              <Link
                href="/payments"
                className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 transition-all duration-300 hover:shadow-md"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Payment Orders
                    </p>
                    <p className="text-xl font-extrabold text-neutral-900">
                      {f.attempts}
                    </p>
                    <p className="text-[11px] text-neutral-400">in this range</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
