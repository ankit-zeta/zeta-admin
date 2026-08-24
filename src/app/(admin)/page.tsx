"use client";

import React from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { 
  Users, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  FileCheck, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export default function AdminOverviewPage() {
  const { token } = useAdminAuth();
  const metrics = useQuery(
    api.analytics.getAdminOverviewMetrics,
    token ? { token } : "skip"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            Administrator Overview
          </h1>
          <p className="text-xs text-textMuted">
            Live database-backed platform metrics, enrollment revenue, and pending approval queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/programs/new" className="btn-secondary text-xs py-1.5 px-3">
            + New Program
          </Link>
          <Link href="/work/new" className="btn-primary text-xs py-1.5 px-3">
            + Post Opportunity
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="card-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-textMain">
            {metrics ? metrics.totalUsers : "—"}
          </p>
          <span className="text-[11px] text-textMuted">
            Active Accounts: <strong>{metrics?.activeUsers || 0}</strong>
          </span>
        </div>

        {/* Program Revenue */}
        <div className="card-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Program Revenue</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-brand-700">
            ₹{metrics ? metrics.totalRevenue.toLocaleString("en-IN") : "—"}
          </p>
          <span className="text-[11px] text-textMuted">
            Total Orders: <strong>{metrics?.totalPurchasesCount || 0}</strong>
          </span>
        </div>

        {/* Pending Withdrawals */}
        <div className="card-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Withdrawals</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">
            ₹{metrics ? metrics.pendingWithdrawalAmount.toLocaleString("en-IN") : "—"}
          </p>
          <Link href="/finance" className="text-[11px] text-amber-700 hover:underline">
            {metrics?.pendingWithdrawalsCount || 0} requests awaiting review →
          </Link>
        </div>

        {/* Active Jobs */}
        <div className="card-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-[10px] font-bold uppercase tracking-wider">Work Marketplace</span>
            <Briefcase className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-textMain">
            {metrics ? metrics.activeJobs : "—"}
          </p>
          <span className="text-[11px] text-textMuted">
            Total Applications: <strong>{metrics?.totalApplications || 0}</strong>
          </span>
        </div>
      </div>

      {/* Revenue Trends Chart / Table */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-textMain">Revenue Trends (Recent 6 Months)</h3>
          <span className="text-xs text-textMuted">Database-Calculated Figures</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics?.revenueByMonth.map((item, idx) => (
            <div key={idx} className="p-3 bg-neutral-50 rounded-lg border border-borderSubtle space-y-1 text-center">
              <span className="text-[10px] font-bold text-textMuted uppercase">{item.month}</span>
              <p className="text-sm font-extrabold text-brand-700">₹{item.revenue.toLocaleString("en-IN")}</p>
              <span className="text-[10px] text-textMuted">{item.orders} Orders</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/users"
          className="card-surface p-5 hover:border-brand-400 transition-colors flex items-center justify-between"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-textMain">Manage Users</h4>
            <p className="text-xs text-textMuted">Inspect profiles, grant access, review activity</p>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-600" />
        </Link>

        <Link
          href="/affiliate"
          className="card-surface p-5 hover:border-brand-400 transition-colors flex items-center justify-between"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-textMain">Affiliate Settings</h4>
            <p className="text-xs text-textMuted">Configure commission rules & inspect sales</p>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-600" />
        </Link>

        <Link
          href="/finance"
          className="card-surface p-5 hover:border-brand-400 transition-colors flex items-center justify-between"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-textMain">Process Payouts</h4>
            <p className="text-xs text-textMuted">Review and complete member withdrawals</p>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-600" />
        </Link>
      </div>
    </div>
  );
}
