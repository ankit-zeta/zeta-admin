"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  PlusCircle,
  Building,
  Smartphone,
  QrCode,
  Mail,
  Landmark,
  FileBarChart,
  Users,
  IndianRupee,
} from "lucide-react";

type Tab = "withdrawals" | "wallets" | "report";

export default function AdminFinancePage() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>("withdrawals");

  const withdrawals = useQuery(
    api.withdrawals.getAllWithdrawalsAdmin,
    token ? { token } : "skip"
  );

  const users = useQuery(api.users.getAllUsers, token ? { token } : "skip");

  const wallets = useQuery(
    api.wallets.getAllWalletsAdmin,
    token ? { token } : "skip"
  );

  const payoutReport = useQuery(
    api.wallets.getPayoutReport,
    token ? { token } : "skip"
  );

  const updateWithdrawalStatus = useMutation(api.withdrawals.updateWithdrawalStatus);
  const adminAdjustWallet = useMutation(api.wallets.adminAdjustWallet);

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [qrView, setQrView] = useState<any | null>(null);

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustType, setAdjustType] = useState("CREDIT");
  const [adjustReason, setAdjustReason] = useState("");

  const handleWithdrawalAction = async (withdrawalId: any, status: string) => {
    if (!token) return;
    const actionLabel = status === "processing" ? "approve" : status === "completed" ? "mark as PAID" : "reject";
    if (!window.confirm(`Are you sure you want to ${actionLabel} this withdrawal? This affects the member's wallet.`)) {
      return;
    }
    setIsProcessing(true);
    setMsg("");

    try {
      await updateWithdrawalStatus({
        token,
        withdrawalId,
        status,
        adminNote: withdrawalNote || undefined,
      });

      setMsg(`Withdrawal marked as ${status.toUpperCase()}.`);
      setSelectedWithdrawal(null);
      setWithdrawalNote("");
    } catch (err: any) {
      setMsg(err.message || "Failed to process withdrawal.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !adjustUserId || !adjustReason) return;

    setIsProcessing(true);
    setMsg("");

    try {
      await adminAdjustWallet({
        token,
        userId: adjustUserId as any,
        amount: Number(adjustAmount),
        type: adjustType,
        reason: adjustReason,
      });

      setMsg("Wallet adjustment applied and recorded in audit ledger.");
      setAdjustmentModalOpen(false);
      setAdjustReason("");
    } catch (err: any) {
      setMsg(err.message || "Failed to adjust wallet.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openAdjustFor = (userId: string) => {
    setAdjustUserId(userId);
    setAdjustmentModalOpen(true);
  };

  const payoutInfo = (w: any) => {
    if (w.payoutMethod === "upi") {
      return (
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-brand-700" />
          <span className="font-mono text-[11px] text-brand-800">{w.payoutDetails.upiId}</span>
        </div>
      );
    }
    if (w.payoutMethod === "upi_qr") {
      return (
        <button
          type="button"
          onClick={() => setQrView(w)}
          className="flex items-center gap-2 group"
          title="Click to open QR image"
        >
          {w.qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.qrImageUrl}
              alt="UPI QR"
              className="w-10 h-10 object-contain border border-borderSubtle rounded bg-white group-hover:ring-2 group-hover:ring-brand-300 transition-shadow cursor-pointer"
            />
          ) : (
            <QrCode className="w-4 h-4 text-neutral-400" />
          )}
          <span className="text-[10px] text-brand-700 font-semibold group-hover:underline">
            View QR
          </span>
        </button>
      );
    }
    if (w.payoutMethod === "paypal") {
      return (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-blue-700" />
          <span className="font-mono text-[11px] text-blue-800">{w.payoutDetails.paypalEmail}</span>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-1.5">
        <Landmark className="w-3.5 h-3.5 text-neutral-500 mt-0.5" />
        <span className="text-[10px] text-textMuted leading-tight">
          {w.payoutDetails.accountHolderName} • {w.payoutDetails.bankName} • A/C:{" "}
          {w.payoutDetails.accountNumber} • IFSC: {w.payoutDetails.ifscCode}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            Finance & Payments
          </h1>
          <p className="text-xs text-textMuted">
            Wallet overview, work & affiliate payouts, and withdrawal processing with QR / bank / UPI details.
          </p>
        </div>

        <button
          onClick={() => setAdjustmentModalOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Wallet Adjustment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-borderSubtle">
        {(
          [
            ["withdrawals", "Withdrawals", Wallet],
            ["wallets", "Wallet Overview", Users],
            ["report", "Payout Report", FileBarChart],
          ] as [Tab, string, any][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-textMuted hover:text-textMain"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* ============ TAB: WITHDRAWALS ============ */}
      {tab === "withdrawals" && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-textMain">Withdrawal Requests Queue</h3>
            <input
              value={withdrawalNote}
              onChange={(e) => setWithdrawalNote(e.target.value)}
              placeholder="Optional note / UTR for this batch..."
              className="px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white w-64"
            />
          </div>

          {withdrawals === undefined ? (
            <div className="p-8 text-center animate-pulse space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-10 text-xs text-textMuted">
              No withdrawal requests currently in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                    <th className="py-3 px-3 font-semibold">User</th>
                    <th className="py-3 px-3 font-semibold">Amount</th>
                    <th className="py-3 px-3 font-semibold">Fee</th>
                    <th className="py-3 px-3 font-semibold">Net Payout</th>
                    <th className="py-3 px-3 font-semibold">Method & Payout Info</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold">Requested At</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-textMain block">{w.user?.name || "Member"}</span>
                        <span className="text-[11px] text-textMuted">{w.user?.email}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-textMain">
                        ₹{w.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-textMuted">₹{w.fee}</td>
                      <td className="py-3 px-3 font-extrabold text-brand-700">
                        ₹{w.netAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-textMain uppercase text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">
                            {w.payoutMethod}
                          </span>
                          {payoutInfo(w)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          w.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : w.status === "requested" || w.status === "under_review" || w.status === "processing"
                            ? "bg-amber-100 text-amber-800"
                            : w.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-neutral-100 text-neutral-700"
                        }`}>
                          {w.status}
                        </span>
                        {w.adminNote && (
                          <p className="text-[10px] text-textMuted mt-1 italic">{w.adminNote}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-textMuted">{new Date(w.requestedAt).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 px-3 text-right">
                        {w.status === "requested" || w.status === "under_review" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleWithdrawalAction(w._id, "processing")}
                              disabled={isProcessing}
                              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(w._id, "rejected")}
                              disabled={isProcessing}
                              className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-semibold hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </div>
                        ) : w.status === "processing" ? (
                          <button
                            onClick={() => handleWithdrawalAction(w._id, "completed")}
                            disabled={isProcessing}
                            className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold hover:bg-green-100"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: WALLET OVERVIEW ============ */}
      {tab === "wallets" && (
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-base font-bold text-textMain">Member Wallet Balances by Source</h3>
          {wallets === undefined ? (
            <div className="p-8 text-center animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-10 text-xs text-textMuted">No wallets yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                    <th className="py-3 px-3 font-semibold">Member</th>
                    <th className="py-3 px-3 font-semibold text-right">Available</th>
                    <th className="py-3 px-3 font-semibold text-right">Work Earnings</th>
                    <th className="py-3 px-3 font-semibold text-right">Affiliate Earnings</th>
                    <th className="py-3 px-3 font-semibold text-right">Total Earned</th>
                    <th className="py-3 px-3 font-semibold text-right">Withdrawn</th>
                    <th className="py-3 px-3 font-semibold text-center">Txns</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {wallets.map((w) => (
                    <tr key={w._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-textMain block">
                          {w.user?.name || "Member"}
                          {w.user?.cvStatus === "verified" && (
                            <span className="ml-1.5 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">
                              CV ✓
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-textMuted">{w.user?.email}</span>
                        <span className="text-[10px] text-textMuted block">{w.user?.role}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-brand-700">
                        ₹{w.availableBalance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right text-textMain">
                        ₹{w.workEarnings.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right text-textMain">
                        ₹{w.affiliateEarnings.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-textMain">
                        ₹{w.totalEarned.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right text-textMuted">
                        ₹{w.totalWithdrawn.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-center text-textMuted">{w.transactionCount}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => openAdjustFor(w.userId)}
                          className="px-2 py-1 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded font-semibold hover:bg-neutral-200"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: PAYOUT REPORT ============ */}
      {tab === "report" && (
        <div className="space-y-6">
          {payoutReport === undefined ? (
            <div className="p-8 text-center animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  ["Active Programmes", payoutReport.totals.jobs, "bg-brand-50 text-brand-800"],
                  ["Applications", payoutReport.totals.applications, "bg-blue-50 text-blue-800"],
                  ["Currently Working", payoutReport.totals.doingWork, "bg-amber-50 text-amber-800"],
                  ["Completed Tasks", payoutReport.totals.completed, "bg-purple-50 text-purple-800"],
                  ["Paid Deliverables", payoutReport.totals.paid, "bg-green-50 text-green-800"],
                  ["Total Paid Out", `₹${payoutReport.totals.totalPaid.toLocaleString("en-IN")}`, "bg-brand-50 text-brand-800"],
                ].map(([label, value, cls]) => (
                  <div key={label as string} className={`card-surface p-4 ${cls}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
                    <p className="text-xl font-extrabold mt-1">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card-surface p-6 space-y-4">
                <h3 className="text-base font-bold text-textMain">
                  Programme / Job Payout Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                        <th className="py-3 px-3 font-semibold">Programme / Job</th>
                        <th className="py-3 px-3 font-semibold">Category</th>
                        <th className="py-3 px-3 font-semibold text-right">Job Payment</th>
                        <th className="py-3 px-3 font-semibold text-right">Applied</th>
                        <th className="py-3 px-3 font-semibold text-right">Working</th>
                        <th className="py-3 px-3 font-semibold text-right">Completed</th>
                        <th className="py-3 px-3 font-semibold text-right">Paid Users</th>
                        <th className="py-3 px-3 font-semibold text-right">Total Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderSubtle">
                      {payoutReport.report.map((r) => (
                        <tr key={r.jobId} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-textMain">{r.title}</td>
                          <td className="py-3 px-3 text-textMuted">{r.category}</td>
                          <td className="py-3 px-3 text-right text-textMuted">₹{r.payment.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-3 text-right">{r.applicationCount}</td>
                          <td className="py-3 px-3 text-right text-amber-700 font-semibold">{r.doingWorkCount}</td>
                          <td className="py-3 px-3 text-right text-purple-700 font-semibold">{r.completedCount}</td>
                          <td className="py-3 px-3 text-right text-green-700 font-semibold">{r.paidUsers}</td>
                          <td className="py-3 px-3 text-right font-extrabold text-brand-700">
                            ₹{r.totalPaid.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* QR Preview Lightbox */}
      {qrView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setQrView(null)}
        >
          <div
            className="card-surface p-6 max-w-sm w-full space-y-4 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-textMain">UPI QR — Payout</h3>
              <button
                onClick={() => setQrView(null)}
                className="text-textMuted hover:text-textMain"
                aria-label="Close"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {qrView.qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrView.qrImageUrl}
                alt="UPI QR"
                className="w-full max-h-[60vh] object-contain border border-borderSubtle rounded bg-white"
              />
            ) : (
              <div className="p-8 text-center text-xs text-textMuted">
                No QR image available.
              </div>
            )}
            <div className="space-y-1 text-xs text-textMuted">
              <p>
                <span className="font-semibold text-textMain">Amount:</span> ₹{qrView.amount.toLocaleString("en-IN")}{" "}
                (Net: ₹{qrView.netAmount.toLocaleString("en-IN")})
              </p>
              <p>
                <span className="font-semibold text-textMain">Holder:</span>{" "}
                {qrView.payoutDetails?.accountHolderName || qrView.user?.name || "—"}
              </p>
              <p>
                <span className="font-semibold text-textMain">Status:</span> {qrView.status}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {qrView.qrImageUrl && (
                <a
                  href={qrView.qrImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary py-1.5 px-4"
                >
                  Open Full Size
                </a>
              )}
              <button
                onClick={() => setQrView(null)}
                className="btn-secondary py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Wallet Adjustment Modal */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">Manual Wallet Adjustment</h3>
            <p className="text-xs text-textMuted">
              Credits or debits are recorded with an immutable audit entry.
            </p>

            <form onSubmit={handleManualAdjustment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-textMain">Select User *</label>
                <select
                  required
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                >
                  <option value="">Select an account...</option>
                  {users?.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) — Avail: ₹{u.availableBalance}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-textMain">Type *</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold text-brand-700"
                  >
                    <option value="CREDIT">CREDIT (+)</option>
                    <option value="DEBIT">DEBIT (-)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-textMain">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-textMain">Mandatory Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Incentive bonus / manual reconciliation"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="btn-secondary py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary py-1.5 px-4"
                >
                  {isProcessing ? "Processing..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}