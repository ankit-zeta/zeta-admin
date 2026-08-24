"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Pencil,
  Trash2, 
  CheckCircle2, 
  Award, 
  ChevronRight, 
  Layers,
  FileText
} from "lucide-react";

export default function AdminProgramsPage() {
  const { token } = useAdminAuth();
  const programs = useQuery(
    api.programs.getAllProgramsAdmin,
    token ? { token } : "skip"
  );

  const deleteProgramMutation = useMutation(api.programs.deleteProgram);
  const [msg, setMsg] = useState("");

  const handleArchive = async (programId: any, name: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;

    try {
      await deleteProgramMutation({
        token,
        programId,
        reason: `Archived via Admin Panel`,
      });
      setMsg(`Program "${name}" archived.`);
    } catch (err: any) {
      setMsg(err.message || "Failed to archive program.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            Programs & Curriculum Management
          </h1>
          <p className="text-xs text-textMuted">
            Create and edit curriculum tiers, configure pricing, manage modules and practical video/text lessons.
          </p>
        </div>

        <Link href="/programs/new" className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Create New Program</span>
        </Link>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs === undefined ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-surface p-6 animate-pulse space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
            </div>
          ))
        ) : programs.length === 0 ? (
          <div className="col-span-2 card-surface p-12 text-center text-xs text-textMuted">
            No programs created yet. Click &quot;Create New Program&quot; to begin.
          </div>
        ) : (
          programs.map((prog) => (
            <div
              key={prog._id}
              className={`card-surface p-6 flex flex-col justify-between space-y-4 ${
                prog.status === "archived" ? "opacity-60 bg-neutral-50" : "bg-white"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    Sort Order: {prog.sortOrder} • {prog.status.toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-textMain">
                    ₹{prog.price.toLocaleString("en-IN")}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-textMain">{prog.name}</h3>
                <p className="text-xs text-textMuted leading-relaxed line-clamp-2">
                  {prog.shortDescription}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-textMuted pt-2 border-t border-borderSubtle">
                  <span>Modules: <strong className="text-textMain">{prog.moduleCount}</strong></span>
                  <span>Enrollments: <strong className="text-brand-700">{prog.enrollmentsCount}</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-borderSubtle flex items-center justify-between">
                <span className="text-xs text-textMuted">{prog.duration}</span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/programs/${prog._id}`}
                    className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Manage Content</span>
                  </Link>
                  <button
                    onClick={() => handleArchive(prog._id, prog.name)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100"
                    title="Archive Program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
