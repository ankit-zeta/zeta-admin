"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  BookOpen,
  Search,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";

type CourseOption = {
  _id: string;
  name: string;
  slug: string;
  moduleCount?: number;
  status?: string;
};

type PlanRow = {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  status: string;
  thumbnail: string;
  bannerImage: string;
  programIds: string[];
  highlights: string[];
  sortOrder: number;
  courses: any[];
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  price: "",
  compareAtPrice: "",
  thumbnail: "",
  bannerImage: "",
  highlights: "",
  status: "draft",
  sortOrder: "99",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminPlansPage() {
  const { token } = useAdminAuth();
  const plans: PlanRow[] | undefined = useQuery(
    api.plans.getAllPlansAdmin,
    token ? { token } : "skip"
  );
  const courses: CourseOption[] | undefined = useQuery(
    api.programs.getAllProgramsAdmin,
    token ? { token } : "skip"
  );

  const createPlan = useMutation(api.plans.createPlan);
  const updatePlan = useMutation(api.plans.updatePlan);
  const deletePlan = useMutation(api.plans.deletePlan);

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PlanRow | null>(null);

  const activeCourses = (courses || []).filter((c) => c.status !== "archived");
  const courseById = useMemo(
    () => new Map((courses || []).map((c) => [c._id, c])),
    [courses]
  );

  const filteredCourseOptions = activeCourses.filter((c) =>
    courseSearch.trim()
      ? c.name.toLowerCase().includes(courseSearch.trim().toLowerCase())
      : true
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setSelectedCourses([]);
    setCourseSearch("");
    setMsg("");
    setEditorOpen(true);
  };

  const openEdit = (p: PlanRow) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      price: p.price.toString(),
      compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : "",
      thumbnail: p.thumbnail || "",
      bannerImage: p.bannerImage || "",
      highlights: (p.highlights || []).join("\n"),
      status: p.status,
      sortOrder: String(p.sortOrder ?? 99),
    });
    setSelectedCourses([...(p.programIds || [])]);
    setCourseSearch("");
    setMsg("");
    setEditorOpen(true);
  };

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const moveCourse = (id: string, dir: -1 | 1) => {
    setSelectedCourses((prev) => {
      const idx = prev.indexOf(id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const canPublish = selectedCourses.length > 0;

  const handleSave = async () => {
    if (!token) return;
    if (!form.name.trim() || !form.slug.trim() || !form.tagline.trim() || form.price === "") {
      setMsg("Name, slug, tagline and price are required.");
      return;
    }
    const status = form.status;
    if (status === "published" && !canPublish) {
      setMsg("A Program must contain at least one course before publishing.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const payload: any = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        programIds: selectedCourses as any,
        highlights: form.highlights
          .split("\n")
          .map((h) => h.trim())
          .filter(Boolean),
        status,
        sortOrder: Number(form.sortOrder) || 99,
        thumbnail: form.thumbnail.trim(),
        bannerImage: form.bannerImage.trim(),
      };
      if (form.compareAtPrice !== "") {
        payload.compareAtPrice = Number(form.compareAtPrice);
      }
      if (editingId) {
        await updatePlan({ token, planId: editingId as any, ...payload });
        setMsg("Program updated.");
      } else {
        await createPlan({ token, ...payload });
        setMsg("Program created.");
      }
      setEditorOpen(false);
    } catch (err: any) {
      setMsg(err.message || "Failed to save program.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    setBusy(true);
    try {
      await deletePlan({ token, planId: deleteTarget._id as any });
      setMsg(`Program "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      setMsg(err.message || "Failed to delete program.");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (rupees: number) =>
    `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">Programs</h1>
          <p className="text-xs text-textMuted">
            A Program bundles one or more Courses into a single purchasable learning
            path. Courses are managed separately and can also exist standalone.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Program</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* Programs list */}
      {plans === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card-surface p-6 animate-pulse space-y-3">
              <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-textMuted space-y-3">
          <Layers className="w-8 h-8 mx-auto text-neutral-300" />
          <p>No Programs yet. Create one and link Courses to it.</p>
          <button onClick={openCreate} className="btn-primary text-xs py-2 px-4">Create your first Program</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div key={p._id} className="card-surface p-6 space-y-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        p.status === "published"
                          ? "bg-green-100 text-green-800"
                          : p.status === "draft"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                      {p.courses.length} course{p.courses.length === 1 ? "" : "s"}
                    </span>
                    {p.status === "published" && p.courses.length === 0 && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        invalid — no courses
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-textMain mt-1.5 truncate">{p.name}</h3>
                  <p className="text-xs text-textMuted line-clamp-1">{p.tagline}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-brand-700">{fmt(p.price)}</p>
                  {p.compareAtPrice && (
                    <p className="text-[10px] text-textMuted line-through">{fmt(p.compareAtPrice)}</p>
                  )}
                </div>
              </div>

              {/* Linked courses */}
              <div className="space-y-1.5">
                {p.courses.map((c: any) => (
                  <div key={c._id} className="flex items-center gap-2 text-xs text-textMain bg-neutral-50 border border-borderSubtle rounded-lg px-2.5 py-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="truncate flex-1">{c.name}</span>
                    <span className="text-[10px] text-textMuted shrink-0">
                      {c.lessonCount} lessons
                    </span>
                  </div>
                ))}
                {p.courses.length === 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    No courses linked yet — this Program can't be published.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-borderSubtle flex items-center justify-between">
                <Link
                  href={`/plans/${p.slug}`}
                  target="_blank"
                  className="text-[11px] text-textMuted hover:text-brand-700 flex items-center gap-1"
                >
                  /plans/{p.slug} <ExternalLink className="w-3 h-3" />
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" /> Edit & link courses
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100"
                    title="Delete Program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="card-surface p-6 max-w-3xl w-full my-8 space-y-5 bg-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-textMain">
                {editingId ? "Edit Program" : "New Program"}
              </h3>
              <button onClick={() => setEditorOpen(false)} className="text-textMuted hover:text-textMain">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                {msg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Program name *</span>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name: v,
                      slug: !editingId || !form.slug ? slugify(v) : f.slug,
                    }));
                  }}
                  placeholder="e.g. Sales & Communication Essentials"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Slug (URL) *</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-mono text-[11px]"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="font-semibold text-textMain">Tagline *</span>
                <input
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="One-line promise shown on cards & checkout"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="font-semibold text-textMain">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white resize-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Price (₹, excl. GST) *</span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Compare-at price (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={form.compareAtPrice}
                  onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Thumbnail URL</span>
                <input
                  value={form.thumbnail}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Banner image URL</span>
                <input
                  value={form.bannerImage}
                  onChange={(e) => setForm((f) => ({ ...f, bannerImage: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="font-semibold text-textMain">Highlights (one per line)</span>
                <textarea
                  value={form.highlights}
                  onChange={(e) => setForm((f) => ({ ...f, highlights: e.target.value }))}
                  rows={3}
                  placeholder={"Certificate per course\nInstant access\nWork-portal eligibility"}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white resize-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                >
                  <option value="draft">Draft</option>
                  <option value="published" disabled={!canPublish}>
                    Published {canPublish ? "" : "(needs ≥1 course)"}
                  </option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Sort order</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
            </div>

            {/* Course linker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-textMain flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-600" /> Courses in this Program
                </h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    canPublish ? "text-brand-700 bg-brand-50" : "text-amber-800 bg-amber-50"
                  }`}
                >
                  {selectedCourses.length} selected
                  {!canPublish && " — publish needs ≥1"}
                </span>
              </div>

              {/* Selected (ordered) */}
              <div className="space-y-1.5">
                {selectedCourses.map((id, i) => {
                  const c = courseById.get(id);
                  return (
                    <div key={id} className="flex items-center gap-2 text-xs bg-brand-50/60 border border-brand-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] font-bold text-brand-700 w-4">{i + 1}.</span>
                      <BookOpen className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span className="flex-1 truncate">{c?.name || id}</span>
                      <button onClick={() => moveCourse(id, -1)} disabled={i === 0} className="p-0.5 text-neutral-400 hover:text-textMain disabled:opacity-30">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveCourse(id, 1)} disabled={i === selectedCourses.length - 1} className="p-0.5 text-neutral-400 hover:text-textMain disabled:opacity-30">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleCourse(id)} className="p-0.5 text-red-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Picker */}
              <div className="rounded-lg border border-borderSubtle overflow-hidden">
                <div className="relative border-b border-borderSubtle">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                  <input
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search courses to add…"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-borderSubtle">
                  {courses === undefined ? (
                    <div className="p-4 text-center text-xs text-textMuted animate-pulse">Loading courses…</div>
                  ) : filteredCourseOptions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-textMuted">
                      No courses found. Create courses under the “Courses” page first.
                    </div>
                  ) : (
                    filteredCourseOptions.map((c) => {
                      const selected = selectedCourses.includes(c._id);
                      return (
                        <button
                          key={c._id}
                          onClick={() => toggleCourse(c._id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                            selected ? "bg-brand-50" : "bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              selected ? "bg-brand-600 border-brand-600 text-white" : "border-neutral-300"
                            }`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-[10px] text-textMuted">
                            {c.moduleCount ?? 0} modules · {c.status}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditorOpen(false)} className="btn-secondary py-2 px-4 text-xs">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={busy}
                className="btn-primary py-2 px-5 text-xs disabled:opacity-50"
              >
                {busy ? "Saving…" : editingId ? "Save Changes" : "Create Program"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-sm w-full space-y-3 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">Delete Program?</h3>
            <p className="text-xs text-textMuted leading-relaxed">
              <strong className="text-textMain">{deleteTarget.name}</strong> will be removed
              from the storefront and checkout. The {deleteTarget.courses.length} linked
              course{deleteTarget.courses.length === 1 ? "" : "s"} are NOT deleted — they
              stay available standalone. Existing enrollments are not affected.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary py-1.5 px-3 text-xs">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="py-1.5 px-4 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete Program"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
