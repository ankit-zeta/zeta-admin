"use client";

import React from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Zap, Plus, Award, CheckCircle2, Layers, Pencil, Trash2, Play, Pause, XCircle } from "lucide-react";

export default function AdminAchievementsPage() {
  const { token } = useAdminAuth();
  const achievements = useQuery(
    api.achievements.getAllAchievementsAdmin,
    token ? { token } : "skip"
  );
  const toggleStatusMutation = useMutation(api.achievements.toggleAchievementStatus);
  const deleteMutation = useMutation(api.achievements.deleteAchievement);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState("");

  const handleToggle = async (achId: string, currentStatus: string) => {
    if (!token) return;
    const next = currentStatus === "active" ? "draft" : "active";
    try {
      await toggleStatusMutation({ token, achievementId: achId as any, status: next });
      setMsg(`${currentStatus === "active" ? "Deactivated" : "Activated"} rule successfully.`);
    } catch (err: any) {
      setMsg(err.message || "Failed to update status.");
    }
  };

  const handleDelete = async (achId: string) => {
    if (!token) return;
    try {
      await deleteMutation({ token, achievementId: achId as any });
      setMsg("Achievement rule deleted (user unlocks removed).");
      setConfirmDelete(null);
    } catch (err: any) {
      setMsg(err.message || "Failed to delete.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            Achievement Rules & Positions Engine
          </h1>
          <p className="text-xs text-textMuted">
            Design configurable qualification criteria (affiliate sales, jobs completed, course completions) without editing code.
          </p>
        </div>

        <Link href="/achievements/new" className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Achievement Rule</span>
        </Link>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements === undefined ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-surface p-6 animate-pulse space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
            </div>
          ))
        ) : achievements.length === 0 ? (
          <div className="col-span-3 card-surface p-12 text-center text-xs text-textMuted">
            No achievement rules created yet.
          </div>
        ) : (
          achievements.map((ach: any) => (
            <div key={ach._id} className="card-surface p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    Mode: {ach.conditionMode} Conditions
                  </span>
                  <span className="text-xs font-bold text-textMain">
                    {ach.unlockCount} Unlocked Users
                  </span>
                </div>

                <h3 className="text-base font-bold text-textMain flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-600" />
                  <span>{ach.name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    ach.status === "active"
                      ? "bg-green-100 text-green-800"
                      : ach.status === "draft"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-neutral-200 text-neutral-600"
                  }`}>
                    {ach.status}
                  </span>
                </h3>

                <p className="text-xs text-textMuted leading-relaxed">{ach.description}</p>

                <div className="space-y-1 pt-2 border-t border-borderSubtle">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Criteria:</span>
                  <ul className="space-y-1 text-xs text-textMuted font-mono">
                    {ach.conditions.map((c: any, idx: number) => (
                      <li key={idx}>
                        • {c.metric.replace(/_/g, " ")} {c.operator} {c.value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {ach.positionName && (
                <div className="pt-3 border-t border-borderSubtle text-[11px] text-brand-700 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Unlocks Position: {ach.positionName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-borderSubtle">
                <Link
                  href={`/achievements/${ach._id}`}
                  className="px-2.5 py-1.5 rounded-lg border border-borderSubtle text-[11px] font-semibold text-textMain hover:bg-neutral-100 flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(ach._id, ach.status)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 border ${
                      ach.status === "active"
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                    title={ach.status === "active" ? "Deactivate rule" : "Activate rule"}
                  >
                    {ach.status === "active" ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Activate
                      </>
                    )}
                  </button>

                  {confirmDelete === ach._id ? (
                    <button
                      onClick={() => handleDelete(ach._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold"
                    >
                      Confirm?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(ach._id)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}