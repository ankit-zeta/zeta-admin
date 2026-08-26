"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  TrendingUp,
  IndianRupee,
  ExternalLink,
  Search,
} from "lucide-react";

type StatusFilter =
  | "all"
  | "created"
  | "paid"
  | "consumed"
  | "cancelled"
  | "failed"
  | "expired";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  created: { label: "Initiated", cls: "bg-blue-100 text-blue-800" },
  paid: { label: "Paid", cls: "bg-green-100 text-green-800" },
  consumed: { label: "Completed", cls: "bg-brand-100 text-brand-800" },
  cancelled: { label: "Cancelled", cls: "bg-amber-100 text-amber-800" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-800" },
  expired: { label: "Expired", cls: "bg-neutral-200 text-neutral-700" },
};

export default function AdminPaymentsPage() {
  const { token } = useAdminAuth();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const data: any = useQuery(
    api.paymentsAdmin.getPaymentOrdersAdmin,
    token ? { token, status: status === "all" ? undefined : status } : "skip"
  );

  const rows: any[] = data?.rows || [];
  const stats: any = data?.stats;

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.razorpayOrderId?.toLowerCase().includes(q) ||
      r.razorpayPaymentId?.toLowerCase().includes(q) ||
      r.receipt?.toLowerCase().includes(q) ||
      r.plan?.name?.toLowerCase().includes(q)
    );
  });

  const fmtRs = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const fmtDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const conversion =
    stats && stats.total > 0
      ? (((stats.paid + stats.consumed) / stats.total) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Payment Orders
        </h1>
        <p className="text-xs text-textMuted">
          Every Razorpay checkout attempt — initiated, paid, cancelled, failed — with
          gateway ids for cross-verification against the Razorpay dashboard.
        </p>
      </div>

      {/* Funnel stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatBox label="Total Attempts" value={stats.total} icon={CreditCard} />
          <StatBox label="In Progress" value={stats.created} icon={Clock} cls="bg-blue-50 text-blue-800" />
          <StatBox label="Paid" value={stats.paid} icon={CheckCircle2} cls="bg-green-50 text-green-800" />
          <StatBox label="Completed" value={stats.consumed} icon={TrendingUp} cls="bg-brand-50 text-brand-800" />
          <StatBox label="Cancelled" value={stats.cancelled} icon={Ban} cls="bg-amber-50 text-amber-800" />
          <StatBox label="Failed" value={stats.failed} icon={XCircle} cls="bg-red-50 text-red-800" />
          <StatBox label="Expired" value={stats.expired} icon={Clock} cls="bg-neutral-100 text-neutral-700" />
          <StatBox
            label="Revenue"
            value={fmtRs(stats.revenuePaise)}
            icon={IndianRupee}
            cls="bg-brand-50 text-brand-800"
          />
        </div>
      )}

      {stats && (
        <div className="card-surface p-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
          <span className="text-textMuted">
            Payment conversion:{" "}
            <strong className="text-brand-700">{conversion}%</strong>{" "}
            <span className="text-[10px]">(paid ÷ total attempts)</span>
          </span>
          <span className="text-textMuted">
            Drop-offs:{" "}
            <strong className="text-amber-700">
              {stats.cancelled + stats.failed + stats.expired}
            </strong>{" "}
            <span className="text-[10px]">(cancelled + failed + expired)</span>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          {(
            [
              ["all", "All"],
              ["created", "Initiated"],
              ["paid", "Paid"],
              ["consumed", "Completed"],
              ["cancelled", "Cancelled"],
              ["failed", "Failed"],
              ["expired", "Expired"],
            ] as [StatusFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                status === key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-textMuted border-borderSubtle hover:text-textMain"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, email, order/payment id…"
            className="pl-8 pr-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white w-full sm:w-72"
          />
        </div>
      </div>

      {/* Orders table */}
      <div className="card-surface p-6">
        {data === undefined ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-textMuted">
            No payment orders{status !== "all" ? ` with status "${STATUS_META[status]?.label || status}"` : ""} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold">Plan</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Razorpay IDs (verify)</th>
                  <th className="py-3 px-3 font-semibold">Created</th>
                  <th className="py-3 px-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {filtered.map((o) => {
                  const meta = STATUS_META[o.status] || {
                    label: o.status,
                    cls: "bg-neutral-100 text-neutral-700",
                  };
                  return (
                    <tr key={o._id} className="hover:bg-neutral-50/60 transition-colors align-top">
                      <td className="py-3 px-3">
                        <span className="font-bold text-textMain block">{o.user?.name || "Unknown"}</span>
                        <span className="text-[11px] text-textMuted break-all">{o.user?.email}</span>
                      </td>
                      <td className="py-3 px-3 text-textMain">{o.plan?.name || "—"}</td>
                      <td className="py-3 px-3 text-right font-bold text-textMain whitespace-nowrap">
                        {fmtRs(o.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {o.statusSource && (
                          <p className="text-[9px] text-textMuted mt-1 uppercase">via {o.statusSource}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() =>
                            window.open(
                              `https://dashboard.razorpay.com/app/orders/${o.razorpayOrderId}`,
                              "_blank"
                            )
                          }
                          className="font-mono text-[10px] text-brand-700 hover:underline flex items-center gap-1"
                          title="Open in Razorpay dashboard"
                        >
                          {o.razorpayOrderId} <ExternalLink className="w-3 h-3" />
                        </button>
                        {o.razorpayPaymentId && (
                          <p className="font-mono text-[10px] text-textMuted mt-0.5">{o.razorpayPaymentId}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-textMuted whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="py-3 px-3 max-w-[220px]">
                        {o.status === "paid" || o.status === "consumed" ? (
                          <p className="text-[10px] text-textMuted">Paid at {fmtDate(o.paidAt)}</p>
                        ) : o.cancelledAt ? (
                          <p className="text-[10px] text-amber-700">
                            {o.status === "cancelled" ? "Cancelled" : "Expired"} at {fmtDate(o.cancelledAt)}
                            {o.cancelSource === "user" ? " (user closed window)" : o.cancelSource === "timeout" ? " (timeout)" : ""}
                          </p>
                        ) : null}
                        {o.failureReason && (
                          <p className="text-[10px] text-textMuted mt-0.5 italic leading-snug">{o.failureReason}</p>
                        )}
                        {!o.failureReason && !o.cancelledAt && o.status === "created" && (
                          <p className="text-[10px] text-textMuted italic">Waiting for payment…</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  cls,
}: {
  label: string;
  value: string | number;
  icon: any;
  cls?: string;
}) {
  return (
    <div className={`card-surface p-4 ${cls || "bg-white"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <Icon className="w-3.5 h-3.5 opacity-50" />
      </div>
      <p className="text-lg font-extrabold mt-1">{value}</p>
    </div>
  );
}
