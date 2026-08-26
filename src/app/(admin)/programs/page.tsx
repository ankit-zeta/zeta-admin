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
  FileText,
  Search,
  ArrowUpDown,
  X
} from "lucide-react";

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortKey =
  | "manual"
  | "name"
  | "price_desc"
  | "price_asc"
  | "enrollments"
  | "newest";

export default function AdminProgramsPage() {
  const { token } = useAdminAuth();
  const programs = useQuery(
    api.programs.getAllProgramsAdmin,
    token ? { token } : "skip"
  );

  // Programs (sellable bundles) that contain each course �?" for "Part of" badges.
  const plans = useQuery(api.plans.getAllPlansAdmin, token ? { token } : "skip");
  const coursePrograms = new Map<string, string[]>();
  const coursePlanIds = new Map<string, string[]>();
  for (const p of plans || []) {
    for (const cid of p.programIds || []) {
      const list = coursePrograms.get(cid) || [];
      list.push(p.name);
      coursePrograms.set(cid, list);
      const ids = coursePlanIds.get(cid) || [];
      ids.push(p._id);
      coursePlanIds.set(cid, ids);
    }
  }

  // Search / filter / sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<string>("all"); // plan _id | "all" | "standalone"
  const [sortBy, setSortBy] = useState<SortKey>("manual");

  const deleteProgramMutation = useMutation(api.programs.deleteProgram);
  const [msg, setMsg] = useState("");

  const visible = React.useMemo(() => {
    if (!programs) return [];
    let rows = [...programs];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.shortDescription?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      rows = rows.filter((c) => c.status === statusFilter);
    }

    if (planFilter === "standalone") {
      rows = rows.filter((c) => (coursePlanIds.get(c._id)?.length || 0) === 0);
    } else if (planFilter !== "all") {
      rows = rows.filter((c) => coursePlanIds.get(c._id)?.includes(planFilter));
    }

    switch (sortBy) {
      case "name":
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price_desc":
        rows.sort((a, b) => b.price - a.price);
        break;
      case "price_asc":
        rows.sort((a, b) => a.price - b.price);
        break;
      case "enrollments":
        rows.sort((a, b) => b.enrollmentsCount - a.enrollmentsCount);
        break;
      case "newest":
        rows.sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        rows.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, plans, search, statusFilter, planFilter, sortBy]);

  const filtersActive =
    search.trim() !== "" || statusFilter !== "all" || planFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setSortBy("manual");
  };

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
            Courses
          </h1>
          <p className="text-xs text-textMuted">
            Individual topic courses with modules and lessons. Courses can live
            standalone or be linked into sellable Programs (see the Programs page).
          </p>
        </div>

        <Link href="/programs/new" className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </Link>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* Search / Filter / Sort toolbar */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by name, description or slug…"
              className="pl-8 pr-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="py-2 px-2.5 rounded-lg border border-borderSubtle text-xs bg-white max-w-[220px]"
              title="Show courses inside a specific Program"
            >
              <option value="all">All Programs</option>
              {(plans || []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
              <option value="standalone">Standalone (no Program)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="py-2 px-2.5 rounded-lg border border-borderSubtle text-xs bg-white"
              title="Sort courses"
            >
              <option value="manual">Sort: Manual order</option>
              <option value="name">Name A → Z</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="enrollments">Most enrolled</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            {(
              [
                ["all", "All"],
                ["published", "Published"],
                ["draft", "Draft"],
                ["archived", "Archived"],
              ] as [StatusFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  statusFilter === key
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-textMuted border-borderSubtle hover:text-textMain"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-textMuted">
            <span>
              Showing{" "}
              <strong className="text-textMain">{visible.length}</strong> of{" "}
              {programs?.length ?? 0} courses
            </span>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courses List */}
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
            No courses created yet. Click &quot;Create New Course&quot; to begin.
          </div>
        ) : visible.length === 0 ? (
          <div className="col-span-2 card-surface p-12 text-center space-y-2">
            <p className="text-xs text-textMuted">
              No courses match your current search/filters.
            </p>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          visible.map((prog) => (
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

                {/* Program membership */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(coursePrograms.get(prog._id)?.length || 0) > 0 ? (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
                        Part of:
                      </span>
                      {coursePrograms.get(prog._id)!.map((name) => (
                        <span
                          key={name}
                          className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full"
                        >
                          <Layers className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                          {name}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                      Standalone course
                    </span>
                  )}
                </div>

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
