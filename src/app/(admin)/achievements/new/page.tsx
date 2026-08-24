"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { ArrowLeft, Save, Plus, Trash2, Zap } from "lucide-react";

export default function NewAchievementPage() {
  const router = useRouter();
  const { token } = useAdminAuth();
  const createAchievementMutation = useMutation(api.achievements.createAchievement);
  const positions = useQuery(api.positions.getAllPositions, token ? { token } : "skip");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("zap");
  const [status, setStatus] = useState("active");
  const [sortOrder, setSortOrder] = useState(1);
  const [conditionMode, setConditionMode] = useState<string>("ALL");
  const [unlockPositionId, setUnlockPositionId] = useState("");
  const [unlockBadgeName, setUnlockBadgeName] = useState("");
  const [notificationText, setNotificationText] = useState("");

  const [conditions, setConditions] = useState<
    { metric: string; operator: string; value: number }[]
  >([
    { metric: "completed_programs", operator: ">=", value: 1 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    setNotificationText(`Congratulations! You unlocked the ${val} achievement.`);
  };

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { metric: "completed_jobs", operator: ">=", value: 1 },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createAchievementMutation({
        token,
        name,
        slug,
        description,
        icon,
        status,
        sortOrder: Number(sortOrder),
        conditionMode,
        conditions,
        unlockPositionId: (unlockPositionId || undefined) as any,
        unlockBadgeName: unlockBadgeName || undefined,
        notificationText,
      });

      router.push("/achievements");
    } catch (err: any) {
      setError(err.message || "Failed to create achievement rule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <Link
        href="/achievements"
        className="inline-flex items-center gap-1.5 text-xs text-textMuted hover:text-textMain font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Achievements</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Configure Achievement Rule
        </h1>
        <p className="text-xs text-textMuted">
          Define multi-metric thresholds (referral sales, job completions, earnings) and unlock actions.
        </p>
      </div>

      <div className="card-surface p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Achievement Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Master Contributor"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">URL Identifier *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="master-contributor"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-textMain">Description *</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this milestone signifies..."
              className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
            />
          </div>

          {/* Condition Builder */}
          <div className="p-5 bg-neutral-50 rounded-xl border border-borderSubtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-textMain text-sm">Condition Rules</h4>
                <p className="text-[11px] text-textMuted">Specify metrics and required operators</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-textMain">Condition Mode:</span>
                <select
                  value={conditionMode}
                  onChange={(e) => setConditionMode(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-borderSubtle bg-white font-bold text-brand-700"
                >
                  <option value="ALL">Match ALL Conditions (AND)</option>
                  <option value="ANY">Match ANY Condition (OR)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-borderSubtle">
                  <span className="font-bold text-textMuted w-5">#{idx + 1}</span>

                  <select
                    value={cond.metric}
                    onChange={(e) => {
                      const copy = [...conditions];
                      copy[idx].metric = e.target.value;
                      setConditions(copy);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-borderSubtle bg-white font-medium flex-1"
                  >
                    <option value="completed_programs">Completed Programs Count</option>
                    <option value="completed_jobs">Completed Jobs Count</option>
                    <option value="approved_jobs">Approved / Accepted Jobs</option>
                    <option value="affiliate_sales">Affiliate Referral Sales Count</option>
                    <option value="valid_referrals">Direct Registrations Count</option>
                    <option value="total_sales_amount">Total Referral Volume (₹)</option>
                    <option value="total_earnings">Total Earned Balance (₹)</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => {
                      const copy = [...conditions];
                      copy[idx].operator = e.target.value;
                      setConditions(copy);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-borderSubtle bg-white font-bold"
                  >
                    <option value=">=">&gt;= (At least)</option>
                    <option value=">">&gt; (Greater than)</option>
                    <option value="==">== (Exact match)</option>
                  </select>

                  <input
                    type="number"
                    required
                    min={1}
                    value={cond.value}
                    onChange={(e) => {
                      const copy = [...conditions];
                      copy[idx].value = Number(e.target.value);
                      setConditions(copy);
                    }}
                    className="w-24 px-3 py-1.5 rounded-lg border border-borderSubtle font-bold text-textMain"
                  />

                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}
                      className="text-neutral-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddCondition}
              className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Condition Metric</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-medium"
              >
                <option value="active">Active (visible to users)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Unlock Position (Title)</label>
              <select
                value={unlockPositionId}
                onChange={(e) => setUnlockPositionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-medium"
              >
                <option value="">— No position —</option>
                {(positions || []).map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Unlock Badge Label</label>
              <input
                type="text"
                value={unlockBadgeName}
                onChange={(e) => setUnlockBadgeName(e.target.value)}
                placeholder="e.g. Verified Specialist Badge"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-textMain">Notification Message</label>
              <input
                type="text"
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-borderSubtle">
            <Link href="/achievements" className="btn-secondary py-2 px-4">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-2 px-5 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Achievement Rule"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
