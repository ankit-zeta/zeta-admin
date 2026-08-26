"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Settings,
  Save,
  ShieldCheck,
  Wallet,
  Briefcase,
  Share2,
  LineChart,
  Percent,
  CheckCircle2,
  Loader2,
  Store,
  CreditCard,
  Receipt,
  Users,
  TrendingUp,
  Landmark,
} from "lucide-react";

// ── Tab config ──────────────────────────────────────────────────────────────

type TabKey = "general" | "withdrawals" | "tax" | "work" | "affiliate" | "dividends";

const TABS: { key: TabKey; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "general", label: "General & Brand", icon: Store, desc: "Brand identity, support contacts" },
  { key: "withdrawals", label: "Withdrawals", icon: Wallet, desc: "Limits, fees, payout methods" },
  { key: "tax", label: "Tax (GST)", icon: Receipt, desc: "GST on program sales" },
  { key: "work", label: "Work Payouts", icon: Briefcase, desc: "Job earning caps & multipliers" },
  { key: "affiliate", label: "Affiliate", icon: Share2, desc: "Commission caps, chain levels" },
  { key: "dividends", label: "Dividends", icon: LineChart, desc: "Future dividend engine config" },
];

const ALL_METHODS = ["upi", "bank_transfer", "upi_qr", "paypal"];

// ── Input components ────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-neutral-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  prefix,
  suffix,
  disabled,
  min,
  max,
  step,
}: {
  value: string | number;
  onChange: (v: any) => void;
  type?: string;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-0">
      {prefix && (
        <span className="px-3 py-2 rounded-l-lg border border-r-0 border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-500">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:opacity-40 disabled:bg-neutral-50 ${
          prefix ? "rounded-l-none" : ""
        } ${suffix ? "rounded-r-none" : ""}`}
      />
      {suffix && (
        <span className="px-3 py-2 rounded-r-lg border border-l-0 border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-500">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
          checked ? "bg-emerald-500" : "bg-neutral-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {desc && <p className="text-[11px] text-neutral-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </h4>
      <div className="flex-1 h-px bg-neutral-100" />
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

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
  const updateSetting = useMutation(api.settings.updateSetting);

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [savingTab, setSavingTab] = useState<TabKey | null>(null);
  const [savedTab, setSavedTab] = useState<TabKey | null>(null);

  // ── General ──
  const [brandName, setBrandName] = useState("ZetaGrow");
  const [tagline, setTagline] = useState("Learn. Work. Grow.");
  const [supportEmail, setSupportEmail] = useState("support@zetagrow.com");
  const [supportPhone, setSupportPhone] = useState("");

  // ── Withdrawals ──
  const [minWithdrawal, setMinWithdrawal] = useState(1000);
  const [maxWithdrawal, setMaxWithdrawal] = useState(100000);
  const [dailyLimit, setDailyLimit] = useState(25000);
  const [monthlyLimit, setMonthlyLimit] = useState(200000);
  const [feePercentage, setFeePercentage] = useState(2);
  const [fixedFee, setFixedFee] = useState(0);
  const [maxFee, setMaxFee] = useState(0);
  const [allowedMethods, setAllowedMethods] = useState<string[]>(["upi", "bank_transfer"]);

  // ── GST ──
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(18);

  // ── Work ──
  const [workDailyCap, setWorkDailyCap] = useState(0);
  const [workMonthlyCap, setWorkMonthlyCap] = useState(0);
  const [workPerJobCap, setWorkPerJobCap] = useState(0);
  const [workMultipliers, setWorkMultipliers] = useState<Record<string, number>>({});

  // ── Affiliate ──
  const [affPerSaleCap, setAffPerSaleCap] = useState(0);
  const [affDailyCap, setAffDailyCap] = useState(0);
  const [affMonthlyCap, setAffMonthlyCap] = useState(0);
  const [affMultipliers, setAffMultipliers] = useState<Record<string, number>>({});
  const [affChainEnabled, setAffChainEnabled] = useState(false);
  const [affChainLevels, setAffChainLevels] = useState<Record<string, number>>({});

  // ── Dividends ──
  const [divEnabled, setDivEnabled] = useState(false);
  const [divRate, setDivRate] = useState(0);
  const [divPeriod, setDivPeriod] = useState("monthly");
  const [divMinBalance, setDivMinBalance] = useState(1000);

  // Load settings
  useEffect(() => {
    if (!allSettings) return;
    const g = allSettings.general;
    if (g) {
      setBrandName(g.brandName || "ZetaGrow");
      setTagline(g.tagline || "Learn. Work. Grow.");
      setSupportEmail(g.supportEmail || "support@zetagrow.com");
      setSupportPhone(g.supportPhone || "");
    }
    const w = allSettings.withdrawals;
    if (w) {
      setMinWithdrawal(w.minimumWithdrawal ?? 1000);
      setMaxWithdrawal(w.maximumWithdrawal ?? 100000);
      setDailyLimit(w.dailyLimit ?? 25000);
      setMonthlyLimit(w.monthlyLimit ?? 200000);
      setFeePercentage(w.feePercentage ?? 2);
      setFixedFee(w.fixedFee ?? 0);
      setMaxFee(w.maxFee ?? 0);
      setAllowedMethods(w.allowedMethods?.length ? w.allowedMethods : ["upi", "bank_transfer"]);
    }
    const gst = allSettings.gst;
    if (gst) {
      setGstEnabled(gst.enabled !== false);
      setGstRate(typeof gst.rate === "number" ? gst.rate : 18);
    }
    const wl = allSettings.workLimits;
    if (wl) {
      setWorkDailyCap(wl.dailyPayoutCap ?? 0);
      setWorkMonthlyCap(wl.monthlyPayoutCap ?? 0);
      setWorkPerJobCap(wl.maxPayoutPerJob ?? 0);
      setWorkMultipliers(wl.positionMultipliers || {});
    }
    const af = allSettings.affiliate;
    if (af) {
      setAffPerSaleCap(af.perSaleCap ?? 0);
      setAffDailyCap(af.dailyCommissionCap ?? 0);
      setAffMonthlyCap(af.monthlyCommissionCap ?? 0);
      setAffMultipliers(af.positionMultipliers || {});
      setAffChainEnabled(!!af.chainEnabled);
      setAffChainLevels(af.chainLevels || {});
    }
    const dv = allSettings.dividends;
    if (dv) {
      setDivEnabled(!!dv.enabled);
      setDivRate(dv.rate ?? 0);
      setDivPeriod(dv.period || "monthly");
      setDivMinBalance(dv.minBalance ?? 1000);
    }
  }, [allSettings]);

  const toggleMethod = (m: string) =>
    setAllowedMethods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  // ── Save handlers (one per tab) ────────────────────────────────

  const saveTab = useCallback(
    async (tab: TabKey) => {
      if (!token) return;
      setSavingTab(tab);
      setSavedTab(null);
      try {
        if (tab === "general") {
          await updateSetting({
            token,
            key: "general",
            value: { brandName, tagline, supportEmail, supportPhone, primaryColor: "#176B4D" },
            reason: "General settings update",
          });
        } else if (tab === "withdrawals") {
          await updateSetting({
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
            reason: "Withdrawal settings update",
          });
        } else if (tab === "tax") {
          await updateSetting({
            token,
            key: "gst",
            value: {
              enabled: gstEnabled,
              rate: Math.max(0, Math.min(28, Number(gstRate) || 0)),
              label: "GST",
              updatedAt: Date.now(),
            },
            reason: "GST settings update",
          });
        } else if (tab === "work") {
          await updateSetting({
            token,
            key: "workLimits",
            value: {
              dailyPayoutCap: Number(workDailyCap),
              monthlyPayoutCap: Number(workMonthlyCap),
              maxPayoutPerJob: Number(workPerJobCap),
              positionMultipliers: workMultipliers,
            },
            reason: "Work payout limits update",
          });
        } else if (tab === "affiliate") {
          await updateSetting({
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
            reason: "Affiliate settings update",
          });
        } else if (tab === "dividends") {
          await updateSetting({
            token,
            key: "dividends",
            value: {
              enabled: divEnabled,
              rate: Number(divRate),
              period: divPeriod,
              minBalance: Number(divMinBalance),
              updatedAt: Date.now(),
            },
            reason: "Dividend settings update",
          });
        }
        setSavedTab(tab);
        setTimeout(() => setSavedTab(null), 3000);
      } catch (err: any) {
        alert(err.message || "Failed to save");
      } finally {
        setSavingTab(null);
      }
    },
    [
      token, updateSetting,
      brandName, tagline, supportEmail, supportPhone,
      minWithdrawal, maxWithdrawal, dailyLimit, monthlyLimit, feePercentage, fixedFee, maxFee, allowedMethods,
      gstEnabled, gstRate,
      workDailyCap, workMonthlyCap, workPerJobCap, workMultipliers,
      affPerSaleCap, affDailyCap, affMonthlyCap, affMultipliers, affChainEnabled, affChainLevels,
      divEnabled, divRate, divPeriod, divMinBalance,
      allSettings,
    ]
  );

  const isLoading = allSettings === undefined;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* ── Sidebar tabs ─────────────────────────────────── */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-6 space-y-1">
          <div className="px-3 mb-4">
            <h1 className="text-lg font-extrabold text-neutral-900">Settings</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Platform configuration</p>
          </div>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-start gap-3 ${
                  active
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? "text-emerald-600" : "text-neutral-400"
                  }`}
                />
                <div>
                  <p className={`text-[12px] font-semibold ${active ? "text-emerald-900" : ""}`}>
                    {tab.label}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────── */}
      <main className="flex-1 min-w-0 pb-16">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-neutral-100 rounded-full w-48" />
            <div className="h-4 bg-neutral-100 rounded-full w-96" />
            <div className="card-surface p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-neutral-50 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">
                  {TABS.find((t) => t.key === activeTab)?.label}
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {TABS.find((t) => t.key === activeTab)?.desc}
                </p>
              </div>
              <button
                onClick={() => saveTab(activeTab)}
                disabled={savingTab === activeTab}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  savedTab === activeTab
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md"
                } disabled:opacity-60`}
              >
                {savingTab === activeTab ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedTab === activeTab ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingTab === activeTab
                  ? "Saving..."
                  : savedTab === activeTab
                  ? "Saved!"
                  : "Save Changes"}
              </button>
            </div>

            {/* ── GENERAL ──────────────────────────────── */}
            {activeTab === "general" && (
              <div className="card-surface p-6 space-y-6">
                <SectionDivider label="Brand Identity" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Brand Name" hint="Shown in header, emails, certificates">
                    <Input value={brandName} onChange={setBrandName} />
                  </Field>
                  <Field label="Tagline" hint="Short slogan displayed on the website">
                    <Input value={tagline} onChange={setTagline} />
                  </Field>
                </div>

                <SectionDivider label="Support Contacts" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Support Email" hint="Primary contact for users">
                    <Input value={supportEmail} onChange={setSupportEmail} type="email" />
                  </Field>
                  <Field label="Support Phone" hint="Displayed on website footer">
                    <Input value={supportPhone} onChange={setSupportPhone} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── WITHDRAWALS ──────────────────────────── */}
            {activeTab === "withdrawals" && (
              <div className="card-surface p-6 space-y-6">
                <SectionDivider label="Amount Limits" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Minimum Withdrawal" hint="Lowest amount a user can request">
                    <Input value={minWithdrawal} onChange={setMinWithdrawal} type="number" prefix="₹" />
                  </Field>
                  <Field label="Maximum per Request" hint="Highest single withdrawal allowed">
                    <Input value={maxWithdrawal} onChange={setMaxWithdrawal} type="number" prefix="₹" />
                  </Field>
                  <Field label="Daily Limit per User" hint="Set 0 to disable daily cap">
                    <Input value={dailyLimit} onChange={setDailyLimit} type="number" prefix="₹" />
                  </Field>
                  <Field label="Monthly Limit per User" hint="Set 0 to disable monthly cap">
                    <Input value={monthlyLimit} onChange={setMonthlyLimit} type="number" prefix="₹" />
                  </Field>
                </div>

                <SectionDivider label="Fees" />
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Fee Percentage" hint="% of withdrawal amount">
                    <Input value={feePercentage} onChange={setFeePercentage} type="number" suffix="%" min={0} max={50} step={0.5} />
                  </Field>
                  <Field label="Fixed Fee" hint="Flat fee per request">
                    <Input value={fixedFee} onChange={setFixedFee} type="number" prefix="₹" min={0} />
                  </Field>
                  <Field label="Max Fee Cap" hint="Maximum total fee (0 = no cap)">
                    <Input value={maxFee} onChange={setMaxFee} type="number" prefix="₹" min={0} />
                  </Field>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Fee = percentage of amount + fixed fee, never exceeding the cap. Example: 2% + ₹0, capped at ₹100.
                </p>

                <SectionDivider label="Payout Methods" />
                <div className="flex flex-wrap gap-2">
                  {ALL_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMethod(m)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all duration-200 ${
                        allowedMethods.includes(m)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                      }`}
                    >
                      {m.replace("_", " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAX (GST) ────────────────────────────── */}
            {activeTab === "tax" && (
              <div className="card-surface p-6 space-y-6">
                <SectionDivider label="GST Configuration" />
                <div className="max-w-md space-y-4">
                  <Toggle
                    checked={gstEnabled}
                    onChange={setGstEnabled}
                    label="Charge GST on program sales"
                    desc="When enabled, prices are shown excluding tax and GST is added at checkout."
                  />
                  <Field
                    label="GST Rate"
                    hint="India standard: 18% for commercial training/coaching (SAC 999293). Split as CGST+SGST or IGST per buyer state."
                  >
                    <Input
                      value={gstRate}
                      onChange={setGstRate}
                      type="number"
                      suffix="%"
                      min={0}
                      max={28}
                      step={0.5}
                      disabled={!gstEnabled}
                    />
                  </Field>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-800">
                  <p className="font-semibold mb-1">How it works</p>
                  <p className="leading-relaxed">
                    When GST is enabled, a program listed at ₹1,000 will show as ₹1,000 + 18% GST = ₹1,180 at checkout.
                    Razorpay collects ₹1,180. Your recorded revenue is ₹1,000 (excl. GST). Changes apply to new orders only.
                  </p>
                </div>
              </div>
            )}

            {/* ── WORK PAYOUTS ─────────────────────────── */}
            {activeTab === "work" && (
              <div className="card-surface p-6 space-y-6">
                <SectionDivider label="Earning Caps" />
                <p className="text-[11px] text-neutral-400 -mt-4">
                  Set 0 for any field to disable that limit. Caps are enforced per user.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Max per Job" hint="Maximum payout for a single job">
                    <Input value={workPerJobCap} onChange={setWorkPerJobCap} type="number" prefix="₹" min={0} />
                  </Field>
                  <Field label="Daily Cap" hint="Per user, per day">
                    <Input value={workDailyCap} onChange={setWorkDailyCap} type="number" prefix="₹" min={0} />
                  </Field>
                  <Field label="Monthly Cap" hint="Per user, per month">
                    <Input value={workMonthlyCap} onChange={setWorkMonthlyCap} type="number" prefix="₹" min={0} />
                  </Field>
                </div>

                {positions && positions.length > 0 && (
                  <>
                    <SectionDivider label="Position Multipliers" />
                    <p className="text-[11px] text-neutral-400 -mt-4">
                      Each position level gets cap × multiplier. A user with "Senior" (2x) gets double the base cap.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {positions.map((p) => (
                        <div key={p._id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {p.name}
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min={0.1}
                              value={workMultipliers[p._id] ?? 1}
                              onChange={(e) =>
                                setWorkMultipliers((prev) => ({ ...prev, [p._id]: Number(e.target.value) }))
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-sm font-bold text-center"
                            />
                            <span className="text-[10px] font-bold text-neutral-400">x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── AFFILIATE ────────────────────────────── */}
            {activeTab === "affiliate" && (
              <div className="card-surface p-6 space-y-6">
                <SectionDivider label="Commission Caps" />
                <p className="text-[11px] text-neutral-400 -mt-4">
                  Set 0 to disable any cap. Caps are per affiliate user.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Max per Sale" hint="Maximum commission on a single sale">
                    <Input value={affPerSaleCap} onChange={setAffPerSaleCap} type="number" prefix="₹" min={0} />
                  </Field>
                  <Field label="Daily Cap" hint="Total commissions per day">
                    <Input value={affDailyCap} onChange={setAffDailyCap} type="number" prefix="₹" min={0} />
                  </Field>
                  <Field label="Monthly Cap" hint="Total commissions per month">
                    <Input value={affMonthlyCap} onChange={setAffMonthlyCap} type="number" prefix="₹" min={0} />
                  </Field>
                </div>

                {positions && positions.length > 0 && (
                  <>
                    <SectionDivider label="Position Multipliers" />
                    <p className="text-[11px] text-neutral-400 -mt-4">
                      Higher positions unlock higher commission caps.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {positions.map((p) => (
                        <div key={p._id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {p.name}
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min={0.1}
                              value={affMultipliers[p._id] ?? 1}
                              onChange={(e) =>
                                setAffMultipliers((prev) => ({ ...prev, [p._id]: Number(e.target.value) }))
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-sm font-bold text-center"
                            />
                            <span className="text-[10px] font-bold text-neutral-400">x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <SectionDivider label="Chain / Upline Commission" />
                <div className="space-y-4">
                  <Toggle
                    checked={affChainEnabled}
                    onChange={setAffChainEnabled}
                    label="Enable Chain Commission"
                    desc="When your referral earns a commission, you earn a % of that commission. Needs the corresponding position to be eligible."
                  />
                  {affChainEnabled && positions && positions.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {positions.map((p) => (
                        <div key={p._id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {p.name}
                          </label>
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
                              className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-sm font-bold text-center"
                            />
                            <span className="text-[10px] font-bold text-neutral-400">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DIVIDENDS ────────────────────────────── */}
            {activeTab === "dividends" && (
              <div className="card-surface p-6 space-y-6">
                <SectionDivider label="Dividend Engine" />
                <div className="max-w-md space-y-4">
                  <Toggle
                    checked={divEnabled}
                    onChange={setDivEnabled}
                    label="Enable Dividends"
                    desc="Configure now — the engine will consume these settings when enabled. Dividends distribute to users by position on a schedule."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Distribution Rate" hint="% of wallet earnings distributed">
                      <Input value={divRate} onChange={setDivRate} type="number" suffix="%" min={0} max={100} disabled={!divEnabled} />
                    </Field>
                    <Field label="Distribution Period">
                      <select
                        value={divPeriod}
                        onChange={(e) => setDivPeriod(e.target.value)}
                        disabled={!divEnabled}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 disabled:opacity-40"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </Field>
                    <Field label="Min Wallet Balance" hint="Minimum balance to be eligible">
                      <Input value={divMinBalance} onChange={setDivMinBalance} type="number" prefix="₹" min={0} disabled={!divEnabled} />
                    </Field>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
                  <p className="font-semibold mb-1">Coming Soon</p>
                  <p className="leading-relaxed">
                    The dividend distribution engine is under development. These settings will be used when the feature goes live.
                  </p>
                </div>
              </div>
            )}

            {/* ── Footer note ──────────────────────────── */}
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                All changes are enforced server-side and recorded in the audit log.
                Limits are applied on payout release, commission approval, and withdrawal requests.
                Setting a limit to <strong>0</strong> disables it.
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
