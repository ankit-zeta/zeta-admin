"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { 
  TrendingUp, 
  Users, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ShieldCheck,
  Save
} from "lucide-react";

export default function AdminAffiliatePage() {
  const { token } = useAdminAuth();

  const affiliateSettings = useQuery(
    api.settings.getSetting,
    { key: "affiliate" }
  );

  const sales = useQuery(
    api.affiliates.getAllAffiliateSalesAdmin,
    token ? { token } : "skip"
  ) as Array<{
    _id: string;
    _creationTime: number;
    purchaseId: string;
    buyerUserId: string;
    referrerUserId: string;
    programId: string;
    saleAmount: number;
    commissionAmount: number;
    status: string;
    ruleUsed: string;
    holdingPeriodEndsAt: number;
    createdAt: number;
    updatedAt: number;
    kind: string | undefined;
    awaitingConsumption: boolean | undefined;
    parentSaleId: string | undefined;
    chainLevel: number | undefined;
    baseCommissionAmount: number | undefined;
    buyer: { _id: string; name: string; email: string } | null;
    referrer: { _id: string; name: string; email: string; referralCode: string } | null;
    program: { _id: string; name: string; price: number } | null;
  }> | undefined;

  const referrals = useQuery(
    api.referrals.getAllReferralsAdmin,
    token ? { token } : "skip"
  ) as Array<{
    _id: string;
    referralCode: string;
    status: string;
    createdAt: number;
    referrer: { _id: string; name: string; email: string; referralCode: string } | null;
    referred: { _id: string; name: string; email: string } | null;
  }> | undefined;

  const updateSettingMutation = useMutation(api.settings.updateSetting);
  const updateCommissionStatusMutation = useMutation(api.affiliates.updateCommissionStatus);

  const [activeTab, setActiveTab] = useState<"sales" | "referrals" | "settings">("sales");

  // Settings form state
  const [enabled, setEnabled] = useState(true);
  const [commissionMethod, setCommissionMethod] = useState("lower_program_rule");
  const [defaultPercentage, setDefaultPercentage] = useState<number>(50);
  const [holdingPeriodDays, setHoldingPeriodDays] = useState<number>(7);
  const [minimumPurchaseAmount, setMinimumPurchaseAmount] = useState<number>(2000);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync settings when loaded
  React.useEffect(() => {
    if (affiliateSettings) {
      setEnabled(affiliateSettings.enabled ?? true);
      setCommissionMethod(affiliateSettings.commissionMethod || "lower_program_rule");
      setDefaultPercentage(affiliateSettings.defaultPercentage ?? 50);
      setHoldingPeriodDays(affiliateSettings.holdingPeriodDays ?? 7);
      setMinimumPurchaseAmount(affiliateSettings.minimumPurchaseAmount ?? 2000);
    }
  }, [affiliateSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSavingSettings(true);
    setSettingsMsg("");

    try {
      await updateSettingMutation({
        token,
        key: "affiliate",
        value: {
          enabled,
          commissionMethod,
          defaultPercentage: Number(defaultPercentage),
          holdingPeriodDays: Number(holdingPeriodDays),
          minimumPurchaseAmount: Number(minimumPurchaseAmount),
        },
        reason: "Admin affiliate settings modification",
      });
      setSettingsMsg("Affiliate engine settings saved successfully!");
    } catch (err: any) {
      setSettingsMsg(err.message || "Failed to update settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleStatusChange = async (saleId: any, status: string, reason: string) => {
    if (!token) return;
    try {
      await updateCommissionStatusMutation({
        token,
        saleId,
        status,
        reason,
      });
    } catch {
      // List re-syncs from the server — stay quiet, no internals in console.
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Affiliate & Commission Engine
        </h1>
        <p className="text-xs text-textMuted">
          Configure dynamic commission calculation rules, monitor direct downline attribution, and approve commissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-borderSubtle pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "sales"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-textMuted hover:bg-neutral-100 hover:text-textMain"
          }`}
        >
          Commission Sales Log ({sales?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "referrals"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-textMuted hover:bg-neutral-100 hover:text-textMain"
          }`}
        >
          Referral Network ({referrals?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "settings"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-textMuted hover:bg-neutral-100 hover:text-textMain"
          }`}
        >
          Configurable Engine Rules
        </button>
      </div>

      {/* TAB 1: Sales */}
      {activeTab === "sales" && (
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-base font-bold text-textMain">Affiliate Commission Log</h3>

          {sales === undefined ? (
            <div className="p-8 text-center animate-pulse space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-10 text-xs text-textMuted">
              No affiliate sales recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                    <th className="py-3 px-3 font-semibold">Referrer</th>
                    <th className="py-3 px-3 font-semibold">Buyer</th>
                    <th className="py-3 px-3 font-semibold">Program</th>
                    <th className="py-3 px-3 font-semibold">Sale</th>
                    <th className="py-3 px-3 font-semibold">Commission</th>
                    <th className="py-3 px-3 font-semibold">Applied Rule</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-textMain block">{sale.referrer?.name}</span>
                        <span className="text-[10px] text-brand-700 font-mono">{sale.referrer?.referralCode}</span>
                      </td>
                      <td className="py-3 px-3 text-textMain">
                        {sale.buyer?.name}
                      </td>
                      <td className="py-3 px-3 text-textMuted">
                        {sale.program?.name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-textMain">
                        ₹{sale.saleAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-brand-700">
                        ₹{sale.commissionAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-textMuted max-w-xs truncate">
                        {sale.ruleUsed}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          sale.status === "available" || sale.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {sale.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(sale._id, "available", "Admin approved commission")}
                                className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold hover:bg-green-100"
                                title="Approve & Release to Available Wallet"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(sale._id, "rejected", "Admin rejected commission")}
                                className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-semibold hover:bg-red-100"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(sale.status === "available" || sale.status === "approved") && (
                            <button
                              onClick={() => handleStatusChange(sale._id, "reversed", "Admin refunded/reversed commission")}
                              className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 flex items-center gap-1"
                              title="Reverse Commission"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reverse</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Referrals */}
      {activeTab === "referrals" && (
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-base font-bold text-textMain">Referral Downline Relationships</h3>
          {referrals && referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                    <th className="py-3 px-3 font-semibold">Referrer (Sponsor)</th>
                    <th className="py-3 px-3 font-semibold">Referred User (Customer)</th>
                    <th className="py-3 px-3 font-semibold">Code Used</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {referrals.map((ref) => (
                    <tr key={ref._id}>
                      <td className="py-3 px-3">
                        <span className="font-bold text-textMain">{ref.referrer?.name}</span>
                        <span className="text-[11px] text-textMuted block">{ref.referrer?.email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-textMain">{ref.referred?.name}</span>
                        <span className="text-[11px] text-textMuted block">{ref.referred?.email}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-700">{ref.referralCode}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded uppercase">
                          {ref.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-textMuted">{new Date(ref.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-textMuted">No referral links registered yet.</div>
          )}
        </div>
      )}

      {/* TAB 3: Configurable Settings */}
      {activeTab === "settings" && (
        <div className="card-surface p-6 sm:p-8 space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-textMain">Configurable Commission Calculation Rules</h3>
            <p className="text-xs text-textMuted">
              Adjust commission formula and holding period without editing application source code.
            </p>
          </div>

          {settingsMsg && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
              {settingsMsg}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-semibold text-textMain">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-borderSubtle text-brand-600"
                />
                <span>Enable Affiliate Referral Engine</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-textMain">Commission Calculation Method *</label>
              <select
                value={commissionMethod}
                onChange={(e) => setCommissionMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-medium"
              >
                <option value="lower_program_rule">
                  50% of Lower-Valued Program (Recommended)
                </option>
                <option value="flat_percentage">
                  Flat Percentage of Program Price
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-textMain">Commission Percentage (%) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={defaultPercentage}
                  onChange={(e) => setDefaultPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-textMain">Holding Period (Days) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={90}
                  value={holdingPeriodDays}
                  onChange={(e) => setHoldingPeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-textMain">Minimum Purchase Amount for Commission (₹)</label>
              <input
                type="number"
                value={minimumPurchaseAmount}
                onChange={(e) => setMinimumPurchaseAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="btn-primary py-2 px-4 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? "Saving Settings..." : "Save Engine Rules"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
