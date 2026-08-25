"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  MapPin,
  CreditCard,
  IdCard,
  Mail,
  Phone,
  RefreshCcw,
} from "lucide-react";

type QueueItem = {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  referralCode: string;
  cvStatus: string;
  fullNameAsPerPan: string;
  panMasked: string;
  aadhaarLast4: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: string;
  rejectionReason?: string;
  submissionCount: number;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
};

type KycDetail = QueueItem & {
  addressLine1?: string;
  addressLine2?: string;
  joinedAt?: number;
  walletBalance: number;
  totalEarned: number;
  verificationMode?: string;
  panImageUrl: string | null;
  aadhaarImageUrl: string | null;
};

const TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function AdminKycPage() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");

  const queue = useQuery(api.kyc.getKycQueueAdmin, token ? { token, status: tab === "all" ? undefined : tab } : "skip") as
    | QueueItem[]
    | undefined;

  const reviewKyc = useMutation(api.kyc.reviewKyc);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState("");

  const detail = useQuery(
    api.kyc.getKycDetailAdmin,
    token && selectedId ? { token, profileId: selectedId as any } : "skip"
  ) as KycDetail | undefined;

  const filtered = (queue || []).filter((k) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      k.userName.toLowerCase().includes(q) ||
      k.userEmail.toLowerCase().includes(q) ||
      k.referralCode.toLowerCase().includes(q) ||
      k.fullNameAsPerPan.toLowerCase().includes(q)
    );
  });

  const handleDecision = async (decision: "verified" | "rejected") => {
    if (!token || !selectedId) return;
    if (decision === "rejected" && !rejectReason.trim()) {
      setMsg("A rejection reason is required.");
      return;
    }
    if (!window.confirm(`Are you sure you want to mark this KYC as ${decision.toUpperCase()}? The member will be notified by email.`)) {
      return;
    }
    setIsProcessing(true);
    setMsg("");
    try {
      await reviewKyc({
        token,
        profileId: selectedId as any,
        decision,
        reason: decision === "rejected" ? rejectReason.trim() : undefined,
      });
      setMsg(`KYC marked as ${decision}.`);
      setSelectedId(null);
      setRejectOpen(false);
      setRejectReason("");
    } catch (err: any) {
      setMsg(err.message || "Failed to update KYC status.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-textMain flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" /> KYC Verification
          </h1>
          <p className="text-xs text-textMuted mt-1">
            Manually verify PAN, Aadhaar and address details. Members are emailed on every outcome.
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, code…"
            className="pl-9 pr-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white w-full sm:w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-borderSubtle">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-textMuted hover:text-textMain"
            }`}
          >
            {t.label}
            {tab === t.key && queue && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold">
                {queue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            msg.includes("Failed") || msg.includes("required")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {msg}
        </div>
      )}

      {/* List */}
      {queue === undefined ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-12 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-neutral-300 mx-auto" />
          <p className="text-sm font-semibold text-textMain">No KYC submissions here</p>
          <p className="text-xs text-textMuted">
            {tab === "pending" ? "The review queue is empty — nice work!" : "No records match this filter yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((k) => (
            <div
              key={k._id}
              className={`card-surface p-4 flex flex-col lg:flex-row lg:items-center gap-4 ${
                selectedId === k._id ? "ring-2 ring-brand-500" : ""
              }`}
            >
              {/* Identity block */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {k.userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-textMain truncate">
                    {k.userName}
                    <span className="ml-2 font-mono text-[10px] text-textMuted">ID: {k.userId.slice(-8)}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-textMuted">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" /> {k.userEmail}
                    </span>
                    {k.userPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {k.userPhone}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-[11px]">
                    <span className="font-mono text-textMain">
                      <CreditCard className="w-3 h-3 inline mr-1 text-textMuted" />
                      PAN {k.panMasked}
                    </span>
                    <span className="font-mono text-textMain">
                      <IdCard className="w-3 h-3 inline mr-1 text-textMuted" />
                      Aadhaar ••••{k.aadhaarLast4}
                    </span>
                    <span className="text-textMuted">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {[k.city, k.state, k.pincode].filter(Boolean).length
                        ? `${k.city ?? ""}${k.city && k.state ? ", " : ""}${k.state ?? ""}${k.pincode ? ` — ${k.pincode}` : ""}`
                        : "Location not on file"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta + actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <StatusPill status={k.status} />
                  <p className="text-[10px] text-textMuted mt-1">
                    Submitted{" "}
                    {new Date(k.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {k.submissionCount > 1 && ` · ${k.submissionCount} attempts`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(selectedId === k._id ? null : k._id)}
                  className="btn-secondary text-[11px] py-2 px-3 whitespace-nowrap"
                >
                  {selectedId === k._id ? "Close" : "Review"}
                </button>
              </div>

              {/* Expanded detail */}
              {selectedId === k._id && (
                <div className="w-full border-t border-borderSubtle pt-4 space-y-4">
                  {detail === undefined ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
                    </div>
                  ) : detail ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <DetailBlock label="Name as per PAN" value={detail.fullNameAsPerPan} />
                        <DetailBlock label="PAN Number" value={detail.panMasked} mono />
                        <DetailBlock label="Aadhaar (last 4)" value={`•••• ${detail.aadhaarLast4}`} mono />
                        <DetailBlock label="CV Status" value={detail.cvStatus.toUpperCase()} />
                        <DetailBlock label="Address" value={[detail.addressLine1, detail.addressLine2].filter(Boolean).join(", ") || "Not collected"} />
                        <DetailBlock label="City / State / PIN" value={[detail.city, detail.state].filter(Boolean).join(", ") + (detail.pincode ? ` — ${detail.pincode}` : "") || "Not collected"} />
                        <DetailBlock label="Wallet Balance" value={`₹${detail.walletBalance.toLocaleString("en-IN")}`} />
                        <DetailBlock label="Lifetime Earnings" value={`₹${detail.totalEarned.toLocaleString("en-IN")}`} />
                      </div>

                      {detail.status === "rejected" && detail.rejectionReason && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Previous rejection reason</p>
                          <p className="text-xs text-red-700 mt-0.5">{detail.rejectionReason}</p>
                        </div>
                      )}

                      {/* Document images */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocPreview title="PAN Card" url={detail.panImageUrl} />
                        <DocPreview title="Aadhaar Card" url={detail.aadhaarImageUrl} />
                      </div>

                      {/* Decision buttons */}
                      {detail.status === "pending" && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <button
                            onClick={() => handleDecision("verified")}
                            disabled={isProcessing}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve &amp; Verify KYC
                          </button>
                          <button
                            onClick={() => setRejectOpen((o) => !o)}
                            disabled={isProcessing}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}

                      {rejectOpen && detail.status === "pending" && (
                        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
                            Rejection reason (emailed to the member)
                          </label>
                          <textarea
                            rows={2}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. PAN card photo is blurry — please re-upload a clear image of the full card"
                            className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
                          />
                          <button
                            onClick={() => handleDecision("rejected")}
                            disabled={isProcessing || !rejectReason.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            Send Rejection
                          </button>
                        </div>
                      )}

                      {detail.reviewedBy && (
                        <p className="text-[10px] text-textMuted flex items-center gap-1.5">
                          <RefreshCcw className="w-3 h-3" />
                          Last reviewed by {detail.reviewedBy} on{" "}
                          {new Date(detail.submittedAt).toLocaleString("en-IN")} · mode: {detail.verificationMode || "manual"}
                        </p>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-blue-100 text-blue-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${map[status] || "bg-neutral-100 text-neutral-600"}`}>
      {status}
    </span>
  );
}

function DetailBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">{label}</p>
      <p className={`mt-0.5 text-textMain break-words ${mono ? "font-mono" : "font-semibold"}`}>{value}</p>
    </div>
  );
}

function DocPreview({ title, url }: { title: string; url: string | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">{title}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title}
          className="w-full max-h-64 object-contain rounded-xl border border-borderSubtle bg-neutral-50 cursor-zoom-in"
          onClick={() => window.open(url, "_blank")}
        />
      ) : (
        <div className="h-40 rounded-xl border border-dashed border-borderSubtle bg-neutral-50 flex items-center justify-center">
          <p className="text-[11px] text-textMuted">Image not available</p>
        </div>
      )}
    </div>
  );
}
