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
  Minus,
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
} from "recharts";

const BRAND = "#176B4D";
const AMBER = "#D97706";
const RED = "#DC2626";
const BLUE = "#2563EB";
const GRID = "#E5E5E5";

const RANGES: [number, string][] = [
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
  [365, "1 year"],
];

function fmtRs(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
  // Exact to the paisa — small/test payments must never round to ₹1.
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDay(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[10px] text-textMuted">no prior data</span>;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
        up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
  accent,
}: {
  label: string;
  value: string;
  icon: any;
  sub?: React.ReactNode;
  badge?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="card-surface p-4 space-y-1.5">
      <div className="flex items-center justify-between text-textMuted">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${accent || "text-brand-600"}`} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xl font-extrabold text-textMain">{value}</p>
        {badge}
      </div>
      {sub && <div className="text-[10px] text-textMuted">{sub}</div>}
    </div>
  );
}

function ChartTooltip() {
  return (
    <Tooltip
      formatter={(value: any, name: any) => [fmtRs(Number(value)), name]}
      labelFormatter={(l: any) => fmtDay(String(l))}
      contentStyle={{
        borderRadius: 8,
        border: "1px solid #E5E5E5",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    />
  );
}

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            Administrator Overview
          </h1>
          <p className="text-xs text-textMuted">
            Growth, revenue and profitability — computed live from the database.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-borderSubtle rounded-lg p-1">
          {RANGES.map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                days === d
                  ? "bg-brand-600 text-white"
                  : "text-textMuted hover:text-textMain"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {data === undefined ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-surface p-4 animate-pulse">
                <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/2 mt-2"></div>
              </div>
            ))}
          </div>
          <div className="card-surface p-6 animate-pulse">
            <div className="h-64 bg-neutral-100 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <KpiCard
              label="Total Users"
              value={String(k.totalUsers)}
              icon={Users}
              sub={
                <>
                  +{k.signupsInRange} in {days}d · {p.activeUsers} active
                </>
              }
              badge={<GrowthBadge pct={k.signupsGrowthPct} />}
            />
            <KpiCard
              label={`Revenue (${days}d)`}
              value={fmtRs(k.grossRevenue)}
              icon={IndianRupee}
              accent="text-brand-600"
              sub={
                <>
                  All-time collected: <strong>{fmtRs(k.allTimeGrossRevenue)}</strong> incl. GST · {k.orders} order{k.orders === 1 ? "" : "s"} in range
                </>
              }
              badge={<GrowthBadge pct={k.revenueGrowthPct} />}
            />
            <KpiCard
              label="Net Revenue"
              value={fmtRs(k.netRevenue)}
              icon={Percent}
              sub={
                <>
                  excl. {data.gst.label} {fmtRs(k.gstCollected)}
                  {data.gst.enabled ? ` @${data.gst.rate}%` : ""}
                </>
              }
            />
            <KpiCard
              label={`Expenses (${days}d)`}
              value={fmtRs(k.expenses)}
              icon={Receipt}
              accent="text-amber-600"
              sub={<Link href="/expenses" className="hover:underline">manage →</Link>}
            />
            <KpiCard
              label="Profit After Tax"
              value={fmtRs(k.profitAfterTax)}
              icon={Wallet}
              accent={k.profitAfterTax >= 0 ? "text-green-600" : "text-red-500"}
              sub={
                <>
                  PBT {fmtRs(k.profitBeforeTax)} · tax @{data.taxRatePct}%
                </>
              }
            />
            <KpiCard
              label="Conversion"
              value={`${k.conversionPct.toFixed(1)}%`}
              icon={TrendingUp}
              sub={
                <>
                  {f.paid}/{f.attempts} attempts · {f.cancelled} dropped
                </>
              }
            />
          </div>

          {/* Signups chart */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textMain">User Signups</h3>
                <p className="text-[11px] text-textMuted">
                  Daily new registrations with cumulative user base
                </p>
              </div>
              <span className="text-xs text-textMuted">
                Today: <strong className="text-brand-700">+{k.newToday}</strong>
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={s.signups} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDay}
                  tick={{ fontSize: 10, fill: "#737373" }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#737373" }} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#737373" }} allowDecimals={false} />
                <ChartTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="signups" name="Daily signups" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Line yAxisId="r" dataKey="cumulative" name="Total users" stroke={BLUE} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue chart */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textMain">Revenue Growth</h3>
                <p className="text-[11px] text-textMuted">
                  Daily gross revenue (paid Razorpay orders, incl. GST) with cumulative total
                </p>
              </div>
              <div className="text-right text-xs text-textMuted">
                <p>
                  All-time collected: <strong className="text-brand-700">{fmtRs(k.allTimeGrossRevenue)}</strong>
                </p>
                <p>
                  In range: <strong className="text-textMain">{fmtRs(k.grossRevenue)}</strong> · {k.allTimeOrders} paid order{k.allTimeOrders === 1 ? "" : "s"} all-time
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={s.revenue} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDay}
                  tick={{ fontSize: 10, fill: "#737373" }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#737373" }} tickFormatter={(v) => fmtRs(v, true)} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#737373" }} tickFormatter={(v) => fmtRs(v, true)} />
                <ChartTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="revenue" name="Daily revenue" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Area yAxisId="r" dataKey="cumulative" name="Cumulative" stroke={BRAND} strokeWidth={2} fill="url(#revFill)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Profitability + breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card-surface p-6 space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-base font-bold text-textMain">Profitability</h3>
                <p className="text-[11px] text-textMuted">
                  Revenue vs expenses vs profit ({data.gst.label}-excl, tax @
                  {data.taxRatePct}% — editable in Expenses)
                </p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={s.profit} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDay}
                    tick={{ fontSize: 10, fill: "#737373" }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#737373" }} tickFormatter={(v) => fmtRs(v, true)} />
                  <ChartTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="expenses" name="Expenses" fill={AMBER} radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Line dataKey="profit" name="Profit" stroke={BLUE} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="card-surface p-6 space-y-4">
              <h3 className="text-base font-bold text-textMain">Expenses by Category</h3>
              {data.expensesByCategory.length === 0 ? (
                <div className="text-center py-10 text-xs text-textMuted">
                  No expenses recorded in this range.
                  <Link href="/expenses" className="block mt-2 text-brand-700 font-bold hover:underline">
                    + Add your first expense
                  </Link>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {data.expensesByCategory.map((c: any, i: number) => (
                          <Cell key={i} fill={c.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {data.expensesByCategory.slice(0, 6).map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-textMuted">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                          {c.name}
                        </span>
                        <span className="font-bold text-textMain">{fmtRs(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Revenue by plan + funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card-surface p-6 space-y-4 lg:col-span-2">
              <h3 className="text-base font-bold text-textMain">Revenue by Plan</h3>
              {data.revenueByPlan.length === 0 ? (
                <div className="text-center py-10 text-xs text-textMuted">No paid orders in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart
                    data={data.revenueByPlan}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#737373" }} tickFormatter={(v) => fmtRs(v, true)} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{ fontSize: 11, fill: "#404040" }}
                    />
                    <ChartTooltip />
                    <Bar dataKey="total" name="Revenue" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card-surface p-6 space-y-3">
              <h3 className="text-base font-bold text-textMain">Payment Funnel ({days}d)</h3>
              {[
                ["Attempts (reached Razorpay)", f.attempts, "bg-blue-500"],
                ["Paid", f.paid, "bg-green-500"],
                ["Cancelled / expired", f.cancelled, "bg-amber-500"],
                ["Failed", f.failed, "bg-red-500"],
                ["Still pending", f.pending, "bg-neutral-400"],
              ].map(([label, value, color]: any) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-textMuted">{label}</span>
                    <span className="font-bold text-textMain">{value}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{
                        width: `${f.attempts > 0 ? (value / f.attempts) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/finance" className="card-surface p-4 hover:border-brand-400 transition-colors flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Pending Withdrawals</p>
                <p className="text-lg font-extrabold text-amber-700">
                  {fmtRs(p.pendingWithdrawalAmount)}
                </p>
                <p className="text-[10px] text-textMuted">{p.pendingWithdrawalsCount} awaiting review</p>
              </div>
              <Wallet className="w-5 h-5 text-amber-500" />
            </Link>
            <Link href="/work" className="card-surface p-4 hover:border-brand-400 transition-colors flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Work Marketplace</p>
                <p className="text-lg font-extrabold text-textMain">{p.activeJobs} active jobs</p>
                <p className="text-[10px] text-textMuted">live opportunities</p>
              </div>
              <Briefcase className="w-5 h-5 text-brand-500" />
            </Link>
            <Link href="/payments" className="card-surface p-4 hover:border-brand-400 transition-colors flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Payment Orders</p>
                <p className="text-lg font-extrabold text-textMain">{f.attempts} in range</p>
                <p className="text-[10px] text-textMuted">inspect & cross-verify →</p>
              </div>
              <ArrowRight className="w-5 h-5 text-brand-500" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
