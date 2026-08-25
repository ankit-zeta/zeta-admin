"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Settings, Save, ShieldCheck, Wallet, Briefcase, Share2, LineChart, Percent } from "lucide-react";

const ALL_METHODS = ["upi", "bank_transfer", "upi_qr", "paypal"];

export default function AdminSettingsPage() {
  const { token } = useAdminAuth();
  const allSettings = useQuery(
    api.settings.getAllSettings,
    token ? { token } : "skip"
  );
  const positions = useQuery(
    api.positions.getAllPositions,
    token ? { token } : "skip"
  );

  const updateSettingMutation = useMutation(api.settings.updateSetting);

  // General & Brand
  const [brandName, setBrandName] = useState("ZetaGrow");
  const [tagline, setTagline] = useState("Learn. Work. Grow.");
  const [supportEmail, setSupportEmail] = useState("support@zetagrow.com");
  const [supportPhone, setSupportPhone] = useState("+91 (080) 4567-8900");

  // Withdrawals
  const [minWithdrawal, setMinWithdrawal] = useState<number>(1000);
  const [maxWithdrawal, setMaxWithdrawal] = useState<number>(100000);
  const [dailyLimit, setDailyLimit] = useState<number>(25000);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(200000);
const [feePercentage, setFeePercentage] = useState<number>(2);
const [fixedFee, setFixedFee] = useState<number>(0);
const [maxFee, setMaxFee] = useState<number>(0);
  const [allowedMethods, setAllowedMethods] = useState<string[]>(["upi", "bank_transfer"]);

  // Work earnings limits (0 = unlimited)
  const [workDailyCap, setWorkDailyCap] = useState<number>(0);
  const [workMonthlyCap, setWorkMonthlyCap] = useState<number>(0);
  const [workPerJobCap, setWorkPerJobCap] = useState<number>(0);
  const [workMultipliers, setWorkMultipliers] = useState<Record<string, number>>({});

  // Affiliate commission limits (0 = unlimited)
  const [affPerSaleCap, setAffPerSaleCap] = useState<number>(0);
  const [affDailyCap, setAffDailyCap] = useState<number>(0);
  const [affMonthlyCap, setAffMonthlyCap] = useState<number>(0);
  const [affMultipliers, setAffMultipliers] = useState<Record<string, number>>({});

  // Chain / upline commission (% of downline's commission, per position level)
  const [affChainEnabled, setAffChainEnabled] = useState(false);
  const [affChainLevels, setAffChainLevels] = useState<Record<string, number>>({});

  // Dividends (future engine config)
  const [divEnabled, setDivEnabled] = useState(false);
  const [divRate, setDivRate] = useState<number>(0);
  const [divPeriod, setDivPeriod] = useState("monthly");
  const [divMinBalance, setDivMinBalance] = useState<number>(1000);

  // Tax (GST) — applied on top of listed program prices at checkout
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState<number>(18);

  const [msg, setMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (allSettings) {
      if (allSettings.general) {
        setBrandName(allSettings.general.brandName || "ZetaGrow");
        setTagline(allSettings.general.tagline || "Learn. Work. Grow.");
        setSupportEmail(allSettings.general.supportEmail || "support@zetagrow.com");
        setSupportPhone(allSettings.general.supportPhone || "+91 (080) 4567-8900");
      }
      if (allSettings.withdrawals) {
        setMinWithdrawal(allSettings.withdrawals.minimumWithdrawal ?? 1000);
        setMaxWithdrawal(allSettings.withdrawals.maximumWithdrawal ?? 100000);
        setDailyLimit(allSettings.withdrawals.dailyLimit ?? 25000);
        setMonthlyLimit(allSettings.withdrawals.monthlyLimit ?? 200000);
        setFeePercentage(allSettings.withdrawals.feePercentage ?? 2);
        setFixedFee(allSettings.withdrawals.fixedFee ?? 0);
        setMaxFee(allSettings.withdrawals.maxFee ?? 0);
        setAllowedMethods(
          allSettings.withdrawals.allowedMethods?.length
            ? allSettings.withdrawals.allowedMethods
            : ["upi", "bank_transfer"]
        );
      }
      if (allSettings.workLimits) {
        setWorkDailyCap(allSettings.workLimits.dailyPayoutCap ?? 0);
        setWorkMonthlyCap(allSettings.workLimits.monthlyPayoutCap ?? 0);
        setWorkPerJobCap(allSettings.workLimits.maxPayoutPerJob ?? 0);
        setWorkMultipliers(allSettings.workLimits.positionMultipliers || {});
      }
      if (allSettings.affiliate) {
        setAffPerSaleCap(allSettings.affiliate.perSaleCap ?? 0);
        setAffDailyCap(allSettings.affiliate.dailyCommissionCap ?? 0);
        setAffMonthlyCap(allSettings.affiliate.monthlyCommissionCap ?? 0);
        setAffMultipliers(allSettings.affiliate.positionMultipliers || {});
        setAffChainEnabled(!!allSettings.affiliate.chainEnabled);
        setAffChainLevels(allSettings.affiliate.chainLevels || {});
      }
      if (allSettings.dividends) {
        setDivEnabled(!!allSettings.dividends.enabled);
        setDivRate(allSettings.dividends.rate ?? 0);
        setDivPeriod(allSettings.dividends.period || "monthly");
        setDivMinBalance(allSettings.dividends.minBalance ?? 1000);
      }
      if (allSettings.gst) {
        setGstEnabled(allSettings.gst.enabled !== false);
        setGstRate(typeof allSettings.gst.rate === "number" ? allSettings.gst.rate : 18);
      }
    }
  }, [allSettings]);

  const toggleMethod = (m: string) => {
    setAllowedMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setMsg("");
    setErrMsg("");
    try {
      await updateSettingMutation({
        token,
        key: "general",
        value: {
          brandName,
          tagline,
          supportEmail,
          supportPhone,
          primaryColor: "#176B4D",
        },
        reason: "Admin general settings update",
      });

      await updateSettingMutation({
        token,
        key: "withdrawals",
        value: {
          minimumWithdrawal: Number(minWithdrawal),
          maximumWithdrawal: Number(maxWithdrawal),
          dailyLimit: Number(dailyLimit),
          monthlyLimit: Number(monthlyLimit),
          feePercentage: Number(feePercentage),
          fixedFee: Number(fixedFee),
          maxFee: Number(maxFee),
          allowedMethods,
        },
        reason: "Admin withdrawal limits & fees update",
      });

      await updateSettingMutation({
        token,
        key: "workLimits",
        value: {
          dailyPayoutCap: Number(workDailyCap),
          monthlyPayoutCap: Number(workMonthlyCap),
          maxPayoutPerJob: Number(workPerJobCap),
          positionMultipliers: workMultipliers,
        },
        reason: "Admin work payout limits update",
      });

      await updateSettingMutation({
        token,
        key: "affiliate",
        value: {
          ...(allSettings?.affiliate || {
            enabled: true,
            commissionMethod: "lower_program_rule",
            defaultPercentage: 50,
            holdingPeriodDays: 7,
            minimumPurchaseAmount: 2000,
          }),
          perSaleCap: Number(affPerSaleCap),
          dailyCommissionCap: Number(affDailyCap),
          monthlyCommissionCap: Number(affMonthlyCap),
          positionMultipliers: affMultipliers,
          chainEnabled: affChainEnabled,
          chainLevels: affChainLevels,
        },
        reason: "Admin affiliate commission limits update",
      });

      await updateSettingMutation({
        token,
        key: "dividends",
        value: {
          enabled: divEnabled,
          rate: Number(divRate),
          period: divPeriod,
          minBalance: Number(divMinBalance),
          updatedAt: Date.now(),
        },
        reason: "Admin dividend configuration update",
      });

      await updateSettingMutation({
        token,
        key: "gst",
        value: {
          enabled: gstEnabled,
          rate: Math.max(0, Math.min(28, Number(gstRate) || 0)),
          label: "GST",
          updatedAt: Date.now(),
        },
        reason: "Admin GST configuration update",
      });

      setMsg("Platform settings saved and recorded in audit log.");
    } catch (err: any) {
      setErrMsg(err.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Platform Configuration & Settings
        </h1>
        <p className="text-xs text-textMuted">
          Full financial control: withdrawal limits, work payouts, affiliate commissions, and dividend engine configuration.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}
      {errMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {errMsg}
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-8 text-xs">
        {/* Brand & General */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-600" /> Brand & Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Brand Name</label>
              <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Tagline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Support Email</label>
              <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Support Phone</label>
              <input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white" />
            </div>
          </div>
        </div>

        {/* Withdrawals */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <Wallet className="w-4 h-4 text-brand-600" /> Withdrawal Thresholds, Limits & Fees
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Minimum Withdrawal (₹)</label>
              <input type="number" min={0} value={minWithdrawal} onChange={(e) => setMinWithdrawal(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Maximum per Request (₹)</label>
              <input type="number" min={0} value={maxWithdrawal} onChange={(e) => setMaxWithdrawal(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Daily Limit per User (₹)</label>
              <input type="number" min={0} value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Monthly Limit per User (₹)</label>
              <input type="number" min={0} value={monthlyLimit} onChange={(e) => setMonthlyLimit(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Fee Percentage (%)</label>
              <input type="number" min={0} max={50} value={feePercentage} onChange={(e) => setFeePercentage(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold text-brand-700" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Fixed Fee (₹, per request)</label>
              <input type="number" min={0} value={fixedFee} onChange={(e) => setFixedFee(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold text-brand-700" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Max Fee Cap (₹, 0 = no cap)</label>
              <input type="number" min={0} value={maxFee} onChange={(e) => setMaxFee(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold text-brand-700" />
              <p className="text-[10px] text-textMuted">Fee = % of amount + flat, never exceeding this cap. Example: 2% capped at ₹100.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-textMain block">Allowed Payout Methods</label>
            <div className="flex flex-wrap gap-2">
              {ALL_METHODS.map((m) => (
                <label key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-borderSubtle bg-white cursor-pointer">
                  <input type="checkbox" checked={allowedMethods.includes(m)} onChange={() => toggleMethod(m)} className="rounded border-borderSubtle text-brand-600" />
                  <span className="font-medium">{m.replace("_", " ").toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Tax (GST) */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <Percent className="w-4 h-4 text-brand-600" /> Tax (GST) on Program Sales
          </h3>
          <p className="text-[11px] text-textMuted leading-relaxed">
            When enabled, program prices are shown excluding tax and {`GST is added at checkout`} —
            the amount charged by Razorpay always includes it. Changes apply to new orders instantly;
            existing paid orders are unaffected.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={gstEnabled}
                  onChange={(e) => setGstEnabled(e.target.checked)}
                  className="rounded border-borderSubtle text-brand-600"
                />
                Charge GST on program sales
              </label>
              <p className="text-[10px] text-textMuted">
                Disabled = listed price is the final payable amount (no tax line).
              </p>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">GST Rate (%)</label>
              <input
                type="number"
                min={0}
                max={28}
                step={0.5}
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                disabled={!gstEnabled}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold text-brand-700 disabled:opacity-50"
              />
              <p className="text-[10px] text-textMuted">
                India standard: 18% for commercial training/coaching (SAC 999293). Split as CGST+SGST or IGST per buyer state.
              </p>
            </div>
          </div>
        </div>

        {/* Work earnings limits */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600" /> Work Payout Limits (0 = unlimited)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Max Payout per Job (₹)</label>
              <input type="number" min={0} value={workPerJobCap} onChange={(e) => setWorkPerJobCap(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Daily Payout Cap per User (₹)</label>
              <input type="number" min={0} value={workDailyCap} onChange={(e) => setWorkDailyCap(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Monthly Payout Cap per User (₹)</label>
              <input type="number" min={0} value={workMonthlyCap} onChange={(e) => setWorkMonthlyCap(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
          </div>
          {positions && positions.length > 0 && (
            <div className="space-y-2">
              <label className="font-semibold text-textMain block">Level Multipliers (cap × multiplier per position)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {positions.map((p) => (
                  <div key={p._id} className="space-y-1">
                    <label className="text-[10px] font-bold text-textMuted uppercase">{p.name}</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0.1}
                      value={workMultipliers[p._id] ?? 1}
                      onChange={(e) =>
                        setWorkMultipliers((prev) => ({ ...prev, [p._id]: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Affiliate limits */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-600" /> Affiliate Commission Limits (0 = unlimited)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Max Commission per Sale (₹)</label>
              <input type="number" min={0} value={affPerSaleCap} onChange={(e) => setAffPerSaleCap(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Daily Commission Cap per User (₹)</label>
              <input type="number" min={0} value={affDailyCap} onChange={(e) => setAffDailyCap(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Monthly Commission Cap per User (₹)</label>
              <input type="number" min={0} value={affMonthlyCap} onChange={(e) => setAffMonthlyCap(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
          </div>
          {positions && positions.length > 0 && (
            <div className="space-y-2">
              <label className="font-semibold text-textMain block">Level Multipliers (cap × multiplier per position)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {positions.map((p) => (
                  <div key={p._id} className="space-y-1">
                    <label className="text-[10px] font-bold text-textMuted uppercase">{p.name}</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0.1}
                      value={affMultipliers[p._id] ?? 1}
                      onChange={(e) =>
                        setAffMultipliers((prev) => ({ ...prev, [p._id]: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chain / Upline Commission */}
          {positions && positions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-borderSubtle">
              <label className="flex items-center gap-2 font-bold text-textMain">
                <input
                  type="checkbox"
                  checked={affChainEnabled}
                  onChange={(e) => setAffChainEnabled(e.target.checked)}
                  className="rounded border-borderSubtle text-brand-600"
                />
                Enable Chain / Upline Commission
              </label>
              <p className="text-[11px] text-textMuted leading-relaxed">
                When your referral (downline) earns a commission on a sale, you earn a % of that commission.
                Example: downline earns ₹1,000 (50% of a ₹2,000 sale) — at 20% chain you earn ₹200.
                A user needs the corresponding position (unlocked via achievements) to be eligible. 0 = level disabled.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {positions.map((p) => (
                  <div key={p._id} className="space-y-1">
                    <label className="text-[10px] font-bold text-textMuted uppercase">{p.name}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="1"
                        min={0}
                        max={100}
                        value={affChainLevels[p._id] ?? 0}
                        onChange={(e) =>
                          setAffChainLevels((prev) => ({ ...prev, [p._id]: Number(e.target.value) }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                      />
                      <span className="text-[10px] font-bold text-textMuted">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dividends */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-textMain flex items-center gap-2">
            <LineChart className="w-4 h-4 text-brand-600" /> Dividend Engine (future distribution)
          </h3>
          <p className="text-[11px] text-textMuted">
            Configure now — the dividend engine will consume these settings when enabled. Dividends can be distributed
            to users by position level on a schedule.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain flex items-center gap-2">
                <input type="checkbox" checked={divEnabled} onChange={(e) => setDivEnabled(e.target.checked)} className="rounded border-borderSubtle text-brand-600" />
                Enable Dividends
              </label>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Rate (% of wallet earnings)</label>
              <input type="number" min={0} max={100} value={divRate} onChange={(e) => setDivRate(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Distribution Period</label>
              <select value={divPeriod} onChange={(e) => setDivPeriod(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Min Wallet Balance for Eligibility (₹)</label>
              <input type="number" min={0} value={divMinBalance} onChange={(e) => setDivMinBalance(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn-primary py-2.5 px-6 flex items-center gap-1.5 shadow-sm">
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving Settings..." : "Save Platform Settings"}</span>
          </button>
        </div>
      </form>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-neutral-50 border border-borderSubtle text-[11px] text-textMuted">
        <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <span>
          All limit changes are enforced server-side on payout release, commission approval, and withdrawal requests,
          and are recorded in the audit log. Setting a limit to 0 disables that limit.
        </span>
      </div>
    </div>
  );
}