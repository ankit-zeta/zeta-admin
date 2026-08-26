"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import {
  Users,
  Briefcase,
  TrendingUp,
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
  Zap,
  DollarSign,
  BarChart3,
  CreditCard,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
  Bar,
} from "recharts";

// ── Color system ────────────────────────────────────────────────────────────

const C = {
  // Primary series
  green: "#16a34a",
  greenLight: "#22c55e",
  greenFill: "rgba(22,163,74,0.08)",
  greenFillStrong: "rgba(22,163,74,0.18)",

  blue: "#2563eb",
  blueFill: "rgba(37,99,235,0.06)",

  amber: "#d97706",
  amberFill: "rgba(217,119,6,0.08)",

  red: "#dc2626",
  redFill: "rgba(220,38,38,0.06)",

  purple: "#7c3aed",
  purpleFill: "rgba(124,58,237,0.06)",

  // Neutral
  text: "#111827",
  textSec: "#6b7280",
  textFaint: "#9ca3af",
  grid: "#f9fafb",
  gridLine: "#f3f4f6",
  border: "#e5e7eb",
};

const RANGES: [number, string][] = [
  [7, "7D"],
  [30, "30D"],
  [90, "90D"],
  [365, "1Y"],
];

// ── Formatters ──────────────────────────────────────────────────────────────

function fmtRs(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toLocaleString("en-IN")}`;
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

function fmtDayShort(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function rangeCaption(days: number): string {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const opts = { day: "numeric", month: "short" } as const;
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString("en-IN", opts)}`;
}

// ── Shared chart config ─────────────────────────────────────────────────────

const AXIS_STYLE = { fontSize: 10, fill: C.textFaint, fontFamily: "Inter" };
const AXIS_LINE = false;
const TICK_LINE = false;

// ── Components ──────────────────────────────────────────────────────────────

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null)
    return <span className="text-[10px] text-neutral-400">N/A</span>;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        up
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
          : "bg-red-50 text-red-700 ring-1 ring-red-200/60"
      }`}
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function KpiCard({
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
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            {label}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-2xl font-extrabold tracking-tight text-neutral-900">
              {value}
            </p>
            {badge}
          </div>
          {sub && <div className="text-[11px] text-neutral-500 leading-relaxed">{sub}</div>}
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
  stats,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  stats?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        {stats}
      </div>
      {children}
    </div>
  );
}

// ── Precision Tooltip ───────────────────────────────────────────────────────

function PrecisionTooltip({
  active,
  payload,
  label,
  valuePrefix = "",
  isCurrency = true,
}: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(12px)",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        fontSize: 12,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        {label ? fmtDayShort(String(label)) : ""}
      </p>
      {payload.map((entry: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "3px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#6b7280", fontSize: 11 }}>{entry.name}</span>
          </div>
          <span style={{ fontWeight: 700, color: "#111827", fontSize: 12, fontFamily: "Inter" }}>
            {valuePrefix}
            {isCurrency
              ? fmtRs(Number(entry.value))
              : Number(entry.value).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

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

  // Compute chart padding for y-axis domain
  const signupMax = useMemo(() => {
    if (!s?.signups) return 10;
    return Math.max(...s.signups.map((d: any) => d.signups || 0), 1);
  }, [s?.signups]);

  const revenueMax = useMemo(() => {
    if (!s?.revenue) return 100;
    return Math.max(...s.revenue.map((d: any) => d.revenue || 0), 100);
  }, [s?.revenue]);

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
                      {f.cancelled + f.failed === 1 ? "" : "s"} dropped
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

  const funnelMax = Math.max(f?.attempts || 0, 1);

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
              Dashboard
            </h1>
          </div>
          <p className="text-[12px] text-neutral-400 pl-[46px]">
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
                  className={`w-4 h-4 ${a.severity === "danger" ? "text-red-600" : "text-amber-600"}`}
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
          <span className="text-[12px] font-medium">All clear — no pending actions.</span>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────── */}
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
          {/* ── KPI: Revenue ──────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              title="Revenue & Profitability"
              hint={`${days}d performance · all figures include GST where applicable`}
              icon={DollarSign}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Gross Collected"
                value={fmtRs(k.grossRevenue)}
                icon={IndianRupee}
                gradient="from-emerald-500 to-emerald-600"
                iconBg="bg-emerald-50 text-emerald-600"
                badge={<GrowthBadge pct={k.revenueGrowthPct} />}
                sub={
                  <>
                    {k.orders} paid order{k.orders === 1 ? "" : "s"} · all-time{" "}
                    {fmtRs(k.allTimeGrossRevenue)}
                  </>
                }
              />
              <KpiCard
                label="Net of GST"
                value={fmtRs(k.netRevenue)}
                icon={Percent}
                gradient="from-blue-500 to-blue-600"
                iconBg="bg-blue-50 text-blue-600"
                sub={
                  <>
                    minus {data.gst.label}{" "}
                    {data.gst.enabled ? `@${data.gst.rate}%` : "off"} ({fmtRs(k.gstCollected)})
                  </>
                }
              />
              <KpiCard
                label="Operating Expenses"
                value={fmtRs(k.expenses)}
                icon={Receipt}
                gradient="from-amber-500 to-amber-600"
                iconBg="bg-amber-50 text-amber-600"
                sub={
                  <Link href="/expenses" className="text-emerald-600 hover:underline font-semibold">
                    manage expenses →
                  </Link>
                }
              />
              <KpiCard
                label="Net Profit"
                value={fmtRs(k.profitAfterTax)}
                icon={Wallet}
                gradient={k.profitAfterTax >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}
                iconBg={k.profitAfterTax >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
                sub={<>after {fmtRs(data.taxRatePct)}% tax on PBT {fmtRs(k.profitBeforeTax)}</>}
              />
            </div>
          </section>

          {/* ── KPI: Customers ────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              title="Customers & Conversion"
              hint="acquisition, conversion and average order metrics"
              icon={Users}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Users"
                value={String(k.totalUsers)}
                icon={Users}
                gradient="from-purple-500 to-purple-600"
                iconBg="bg-purple-50 text-purple-600"
                badge={<GrowthBadge pct={k.signupsGrowthPct} />}
                sub={<>{p.activeUsers} active · +{k.signupsInRange} joined in {days}d</>}
              />
              <KpiCard
                label="Checkout Conversion"
                value={`${k.conversionPct.toFixed(1)}%`}
                icon={Target}
                gradient="from-blue-500 to-blue-600"
                iconBg="bg-blue-50 text-blue-600"
                sub={<>{f.paid} paid of {f.attempts} attempts</>}
              />
              <KpiCard
                label="Avg Order Value"
                value={fmtRs(k.avgOrderValue || 0)}
                icon={ShoppingCart}
                gradient="from-emerald-500 to-emerald-600"
                iconBg="bg-emerald-50 text-emerald-600"
                sub={<>per paid order, incl. GST</>}
              />
              <KpiCard
                label="Revenue Per User"
                value={fmtRs(k.arpu || 0)}
                icon={UserPlus}
                gradient="from-amber-500 to-amber-600"
                iconBg="bg-amber-50 text-amber-600"
                sub={<>all-time collected / all users</>}
              />
            </div>
          </section>

          {/* ── CHARTS ────────────────────────────────────── */}

          {/* User Growth — smooth area + line */}
          <ChartCard
            title="User Growth"
            subtitle="Daily registrations (area) vs cumulative user base (line)"
            stats={
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                  <span className="text-neutral-400">Today:</span>
                  <span className="font-bold" style={{ color: C.green }}>+{k.newToday}</span>
                </div>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={s.signups} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSignup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.gridLine} vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDay}
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  yAxisId="left"
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  allowDecimals={false}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip content={<PrecisionTooltip isCurrency={false} />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="signups"
                  name="Daily signups"
                  stroke={C.green}
                  strokeWidth={2}
                  fill="url(#gSignup)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  name="Total users"
                  stroke={C.blue}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue — smooth area chart with cumulative */}
          <ChartCard
            title="Revenue Trend"
            subtitle="Daily collections (area) with cumulative running total (line)"
            stats={
              <div className="text-right text-[11px]">
                <p className="text-neutral-400">This range</p>
                <p className="font-bold text-neutral-900">{fmtRs(k.grossRevenue)}</p>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={s.revenue} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gRevLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.green} />
                    <stop offset="100%" stopColor={C.greenLight} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.gridLine} vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDay}
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  yAxisId="left"
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  tickFormatter={(v) => fmtRs(v, true)}
                  width={50}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  tickFormatter={(v) => fmtRs(v, true)}
                  width={50}
                />
                <Tooltip content={<PrecisionTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Daily revenue"
                  stroke={C.green}
                  strokeWidth={2}
                  fill="url(#gRev)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative"
                  stroke={C.blue}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue vs Expenses vs Profit — precision lines */}
          <ChartCard
            title="Revenue vs Expenses vs Profit"
            subtitle={`3-line trend · ${data.gst.label}-excl, tax @${data.taxRatePct}% · editable in `}
            stats={
              <Link href="/expenses" className="text-[11px] text-emerald-600 hover:underline font-semibold">
                Expenses →
              </Link>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={s.profit} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gProfitGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gProfitAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.amber} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.gridLine} vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDay}
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  tick={AXIS_STYLE}
                  axisLine={AXIS_LINE}
                  tickLine={TICK_LINE}
                  tickFormatter={(v) => fmtRs(v, true)}
                  width={55}
                />
                <Tooltip content={<PrecisionTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={C.green}
                  strokeWidth={2.5}
                  fill="url(#gProfitGreen)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke={C.amber}
                  strokeWidth={2}
                  fill="url(#gProfitAmber)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                  animationBegin={200}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke={C.blue}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={1200}
                  animationBegin={400}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Expense Split + Best-Selling + Funnel ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense Split */}
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
                  <Link href="/expenses" className="text-[11px] text-emerald-600 font-bold hover:underline">
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
                        <Tooltip
                          formatter={(v: any) => fmtRs(Number(v))}
                          contentStyle={{
                            borderRadius: 10,
                            border: "none",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: 11,
                            padding: "8px 12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5">
                    {data.expensesByCategory.slice(0, 5).map((c: any, i: number) => {
                      const maxVal = Math.max(...data.expensesByCategory.map((e: any) => e.total));
                      const pct = maxVal > 0 ? (c.total / maxVal) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-2 text-neutral-600">
                              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                              {c.name}
                            </span>
                            <span className="font-bold text-neutral-900">{fmtRs(c.total)}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${pct}%`, background: c.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Best-Selling Plans — horizontal bars */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Best-Selling Plans</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">revenue per plan in range</p>
                </div>
              </div>
              {data.revenueByPlan.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-[11px] text-neutral-400">No paid orders in range</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.revenueByPlan.slice(0, 8).map((plan: any, i: number) => {
                    const maxRev = Math.max(...data.revenueByPlan.map((p: any) => p.total));
                    const pct = maxRev > 0 ? (plan.total / maxRev) * 100 : 0;
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-neutral-700 truncate max-w-[60%]">
                            {plan.name}
                          </span>
                          <span className="font-bold text-neutral-900">{fmtRs(plan.total)}</span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${C.green}, ${C.greenLight})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Checkout Funnel — full width precision */}
          <ChartCard
            title="Checkout Funnel"
            subtitle={`${days}d · from Razorpay`}
            stats={
              <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-neutral-400" />
              </div>
            }
          >
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Reached checkout", value: f.attempts, color: C.blue, bg: "bg-blue-50" },
                { label: "Paid", value: f.paid, color: C.green, bg: "bg-emerald-50" },
                { label: "Cancelled", value: f.cancelled, color: C.amber, bg: "bg-amber-50" },
                { label: "Failed", value: f.failed, color: C.red, bg: "bg-red-50" },
                { label: "Pending", value: f.pending, color: C.textFaint, bg: "bg-neutral-50" },
              ].map((item) => (
                <div key={item.label} className="text-center space-y-2">
                  <div
                    className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto`}
                  >
                    <span className="text-lg font-extrabold" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-700">{item.label}</p>
                    <p className="text-[10px] text-neutral-400">
                      {funnelMax > 0 ? ((item.value / funnelMax) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* ── Quick Actions ──────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader title="Quick Actions" hint="jump to areas that need attention" icon={Zap} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/finance"
                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:shadow-md ${
                  p.pendingWithdrawalsCount > 0
                    ? "border-amber-200 ring-1 ring-amber-100"
                    : "border-neutral-100"
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-amber-500" />
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
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Work Marketplace
                    </p>
                    <p className="text-xl font-extrabold text-neutral-900">{p.activeJobs}</p>
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
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 to-blue-500" />
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Payment Orders
                    </p>
                    <p className="text-xl font-extrabold text-neutral-900">{f.attempts}</p>
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
