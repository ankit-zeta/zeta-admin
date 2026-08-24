"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/lib/convex";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Layers,
  FileText,
  BookOpen,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";

type Tab = "overview" | "curriculum" | "resources";

export default function AdminProgramDetailPage() {
  const params = useParams();
  const programId = params?.id as any;
  const { token } = useAdminAuth();

  const detail = useQuery(
    api.programs.getProgramAdminDetail,
    token && programId ? { token, programId } : "skip"
  );

  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState("");

  // Curriculum editors
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [newModuleOpen, setNewModuleOpen] = useState(false);

  // Resource editors
  const [editingResource, setEditingResource] = useState<any>(null);
  const [newResourceOpen, setNewResourceOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const createModuleM = useMutation(api.learning.createModule);
  const updateModuleM = useMutation(api.learning.updateModule);
  const deleteModuleM = useMutation(api.learning.deleteModule);
  const createLessonM = useMutation(api.learning.createLesson);
  const updateLessonM = useMutation(api.learning.updateLesson);
  const deleteLessonM = useMutation(api.learning.deleteLesson);
  const createResourceM = useMutation(api.resources.createResource);
  const updateResourceM = useMutation(api.resources.updateResource);
  const deleteResourceM = useMutation(api.resources.deleteResource);
  const updateProgramM = useMutation(api.programs.updateProgram);
  const generateUploadUrl = useAction(api.resources.generateUploadUrl);

  const [editingProgram, setEditingProgram] = useState(false);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 4000);
  };

  const uploadFile = async (file: File): Promise<string> => {
    setUploadingFile(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const put = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed");
      const { storageId } = await put.json();
      return storageId as string;
    } finally {
      setUploadingFile(false);
    }
  };

  if (detail === undefined) {
    return (
      <div className="card-surface p-12 text-center animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/3 mx-auto"></div>
        <div className="h-64 bg-neutral-200 rounded"></div>
      </div>
    );
  }

  const { modules, resources, ...program } = detail;

  return (
    <div className="space-y-8 pb-16">
      <Link
        href="/programs"
        className="inline-flex items-center gap-1.5 text-xs text-textMuted hover:text-textMain font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Programs</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
            {program.status.toUpperCase()} • ₹{program.price.toLocaleString("en-IN")} •{" "}
            {program.duration}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-textMain">{program.name}</h1>
          <p className="text-xs text-textMuted max-w-2xl">{program.shortDescription}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-textMuted shrink-0">
          <span>
            Modules: <strong className="text-textMain">{modules.length}</strong>
          </span>
          <span>
            Lessons:{" "}
            <strong className="text-textMain">
              {modules.reduce((n, m) => n + m.lessons.length, 0)}
            </strong>
          </span>
          <span>
            Resources: <strong className="text-textMain">{resources.length}</strong>
          </span>
        </div>
        <button
          onClick={() => setEditingProgram(true)}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-borderSubtle">
        {(
          [
            ["overview", "Overview", BookOpen],
            ["curriculum", "Modules & Lessons", Layers],
            ["resources", "Resources", FileText],
          ] as [Tab, string, any][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-textMuted hover:text-textMain"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">
              What's Included
            </h3>
            <ul className="space-y-2">
              {program.whatIncluded.map((item: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-xs text-textMain/90">
                  <span className="shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">
              Learning Outcomes
            </h3>
            <ul className="space-y-2">
              {program.outcomes.map((item: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-xs text-textMain/90">
                  <span className="shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-6 space-y-4 lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">
              Program Description
            </h3>
            <p className="text-xs text-textMain/90 leading-relaxed whitespace-pre-line">
              {program.description}
            </p>
          </div>

          <div className="card-surface p-6 space-y-4 lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">
              FAQs ({program.faqs.length})
            </h3>
            <div className="divide-y divide-borderSubtle">
              {program.faqs.map((f: any, i: number) => (
                <div key={i} className="py-3 space-y-1">
                  <p className="text-xs font-bold text-textMain">{f.question}</p>
                  <p className="text-xs text-textMuted leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CURRICULUM TAB */}
      {tab === "curriculum" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setNewModuleOpen(true);
                setEditingModule(null);
              }}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Module</span>
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="card-surface p-12 text-center text-xs text-textMuted">
              No modules yet. Add the first module to start building the curriculum.
            </div>
          ) : (
            modules.map((mod) => (
              <div key={mod._id} className="card-surface overflow-hidden">
                <div className="p-5 flex items-start justify-between gap-4 border-b border-borderSubtle bg-neutral-50/60">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        Module {mod.sortOrder}
                      </span>
                      <h3 className="text-sm font-bold text-textMain">{mod.title}</h3>
                    </div>
                    {mod.description && (
                      <p className="text-xs text-textMuted">{mod.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setEditingModule(mod);
                        setNewModuleOpen(true);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-brand-700 rounded-lg hover:bg-brand-50"
                      title="Edit Module"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!token) return;
                        if (!confirm(`Delete module "${mod.title}" and all its lessons?`)) return;
                        await deleteModuleM({ token, moduleId: mod._id });
                        flash(`Module "${mod.title}" deleted.`);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-borderSubtle">
                  {mod.lessons.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-textMuted">
                      No lessons in this module yet.
                    </div>
                  ) : (
                    mod.lessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                              lesson.type === "video"
                                ? "bg-violet-50 text-violet-600"
                                : "bg-brand-50 text-brand-700"
                            }`}
                          >
                            {lesson.type === "video" ? (
                              <BookOpen className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-bold text-textMain truncate">
                              {lesson.title}
                              {lesson.isPreview && (
                                <span className="ml-2 text-[9px] font-bold uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                                  Preview
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-textMuted flex items-center gap-2">
                              <span className="capitalize">{lesson.type}</span>
                              <Clock className="w-3 h-3" />
                              {lesson.durationMinutes} min
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  lesson.status === "published"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {lesson.status}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingLesson(lesson)}
                            className="p-1.5 text-neutral-400 hover:text-brand-700 rounded-lg hover:bg-brand-50"
                            title="Edit Lesson"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!token) return;
                              if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
                              await deleteLessonM({ token, lessonId: lesson._id });
                              flash(`Lesson "${lesson.title}" deleted.`);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setEditingLesson({ moduleId: mod._id, sortOrder: mod.lessons.length + 1 })}
                    className="w-full py-3 text-[11px] font-semibold text-brand-700 hover:bg-brand-50/60 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Lesson to this Module
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* RESOURCES TAB */}
      {tab === "resources" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setNewResourceOpen(true);
                setEditingResource(null);
              }}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>

          {resources.length === 0 ? (
            <div className="card-surface p-12 text-center text-xs text-textMuted">
              No resources for this program yet. Add PDFs, templates, or document links.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((r) => (
                <div key={r._id} className="card-surface p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-bold text-textMain truncate">{r.title}</p>
                      <p className="text-[11px] text-textMuted line-clamp-2">{r.description}</p>
                      <p className="text-[10px] text-textMuted">
                        {r.fileType} • {r.fileSize} • {r.accessType} • sort {r.sortOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingResource(r)}
                      className="p-1.5 text-neutral-400 hover:text-brand-700 rounded-lg hover:bg-brand-50"
                      title="Edit Resource"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!token) return;
                        if (!confirm(`Delete resource "${r.title}"?`)) return;
                        await deleteResourceM({ token, resourceId: r._id });
                        flash(`Resource "${r.title}" deleted.`);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROGRAM DETAILS EDITOR */}
      {editingProgram && (
        <Modal title="Edit Program Details" onClose={() => setEditingProgram(false)}>
          <ProgramForm
            initial={program}
            onSaved={(m: string) => {
              setEditingProgram(false);
              flash(m);
            }}
            updateProgramM={updateProgramM}
            token={token}
          />
        </Modal>
      )}

      {/* MODULE EDITOR */}
      {(newModuleOpen || editingModule) && (
        <Modal
          title={editingModule ? "Edit Module" : "Add Module"}
          onClose={() => {
            setNewModuleOpen(false);
            setEditingModule(null);
          }}
        >
          <ModuleForm
            initial={editingModule}
            programId={program._id}
            onSaved={(m: string) => {
              setNewModuleOpen(false);
              setEditingModule(null);
              flash(m);
            }}
            createModuleM={createModuleM}
            updateModuleM={updateModuleM}
            token={token}
          />
        </Modal>
      )}

      {/* LESSON EDITOR */}
      {editingLesson && (
        <Modal
          title={editingLesson._id ? "Edit Lesson" : "Add Lesson"}
          onClose={() => setEditingLesson(null)}
        >
          <LessonForm
            initial={editingLesson}
            programId={program._id}
            onSaved={(m: string) => {
              setEditingLesson(null);
              flash(m);
            }}
            createLessonM={createLessonM}
            updateLessonM={updateLessonM}
            token={token}
          />
        </Modal>
      )}

      {/* RESOURCE EDITOR */}
      {(newResourceOpen || editingResource) && (
        <Modal
          title={editingResource ? "Edit Resource" : "Add Resource"}
          onClose={() => {
            setNewResourceOpen(false);
            setEditingResource(null);
          }}
        >
          <ResourceForm
            initial={editingResource}
            programId={program._id}
            onSaved={(m: string) => {
              setNewResourceOpen(false);
              setEditingResource(null);
              flash(m);
            }}
            createResourceM={createResourceM}
            updateResourceM={updateResourceM}
            uploadFile={uploadFile}
            uploadingFile={uploadingFile}
            token={token}
          />
        </Modal>
      )}
    </div>
  );
}

function ProgramForm({ initial, onSaved, updateProgramM, token }: any) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(initial?.compareAtPrice);
  const [status, setStatus] = useState(initial?.status ?? "published");
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail ?? "");
  const [bannerImage, setBannerImage] = useState(initial?.bannerImage ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [accessDuration, setAccessDuration] = useState(initial?.accessDuration ?? "Lifetime Access");
  const [certificateEnabled, setCertificateEnabled] = useState(initial?.certificateEnabled ?? true);
  const [affiliateEnabled, setAffiliateEnabled] = useState(initial?.affiliateEnabled ?? true);
const [format, setFormat] = useState(initial?.format ?? "text");
const [category, setCategory] = useState(initial?.category ?? "Digital Skills");
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 1);
  const [inclusions, setInclusions] = useState<string[]>(initial?.whatIncluded ?? []);
  const [outcomes, setOutcomes] = useState<string[]>(initial?.outcomes ?? []);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(initial?.faqs ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleList = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    idx: number,
    val: string
  ) => {
    const copy = [...list];
    copy[idx] = val;
    setter(copy);
  };

  const handleFaq = (idx: number, field: "question" | "answer", val: string) => {
    const copy = [...faqs];
    copy[idx] = { ...copy[idx], [field]: val };
    setFaqs(copy);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim() || !slug.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateProgramM({
        token,
        programId: initial._id,
        name,
        slug,
        shortDescription,
        description,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        status,
        thumbnail,
        bannerImage: bannerImage || undefined,
        duration,
        accessDuration,
        certificateEnabled,
        affiliateEnabled,
      format,
      category,
        sortOrder: Number(sortOrder),
        whatIncluded: inclusions.filter(Boolean),
        outcomes: outcomes.filter(Boolean),
        faqs: faqs.filter((f) => f.question.trim()),
      });
      onSaved("Program details updated.");
    } catch (err: any) {
      setError(err.message || "Failed to save program.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Program Name">
          <input value={name} onChange={(e) => handleNameChange(e.target.value)} className="input" required />
        </Field>
        <Field label="URL Slug">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input font-mono" required />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Price (₹)">
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="input" required />
        </Field>
        <Field label="Compare At (₹)">
          <input type="number" value={compareAtPrice ?? ""} onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)} className="input" />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>
              <div className="grid grid-cols-2 gap-3">
          <Field label="Course Format">
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="input">
              <option value="text">Text-based</option>
              <option value="video">Video lessons</option>
              <option value="mixed">Text + Video</option>
            </select>
          </Field>
          <Field label="Category / Field">
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Digital Skills, Marketing, Skilled Trades..." className="input" />
          </Field>
        </div>
<div className="grid grid-cols-2 gap-3">
        <Field label="Duration">
          <input value={duration} onChange={(e) => setDuration(e.target.value)} className="input" placeholder="e.g. 6.5 Hours" />
        </Field>
        <Field label="Access Duration">
          <input value={accessDuration} onChange={(e) => setAccessDuration(e.target.value)} className="input" />
        </Field>
      </div>
      <Field label="Short Description">
        <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="input" />
      </Field>
      <Field label="Full Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Thumbnail Image URL">
          <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} className="input" placeholder="https://..." />
        </Field>
        <Field label="Banner Image URL (optional)">
          <input value={bannerImage ?? ""} onChange={(e) => setBannerImage(e.target.value)} className="input" placeholder="https://..." />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sort Order">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-xs text-textMuted cursor-pointer select-none pt-5">
          <input type="checkbox" checked={certificateEnabled} onChange={(e) => setCertificateEnabled(e.target.checked)} className="accent-brand-600" />
          Certificate
        </label>
        <label className="flex items-center gap-2 text-xs text-textMuted cursor-pointer select-none pt-5">
          <input type="checkbox" checked={affiliateEnabled} onChange={(e) => setAffiliateEnabled(e.target.checked)} className="accent-brand-600" />
          Affiliates
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">What's Included</span>
          <button type="button" onClick={() => setInclusions([...inclusions, ""])} className="text-[11px] font-semibold text-brand-700 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        {inclusions.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input value={item} onChange={(e) => handleList(setInclusions, inclusions, idx, e.target.value)} className="input text-[11px]" />
            <button type="button" onClick={() => setInclusions(inclusions.filter((_, i) => i !== idx))} className="text-neutral-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Learning Outcomes</span>
          <button type="button" onClick={() => setOutcomes([...outcomes, ""])} className="text-[11px] font-semibold text-brand-700 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        {outcomes.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input value={item} onChange={(e) => handleList(setOutcomes, outcomes, idx, e.target.value)} className="input text-[11px]" />
            <button type="button" onClick={() => setOutcomes(outcomes.filter((_, i) => i !== idx))} className="text-neutral-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">FAQs</span>
          <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-[11px] font-semibold text-brand-700 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add FAQ
          </button>
        </div>
        {faqs.map((f, idx) => (
          <div key={idx} className="space-y-1.5 border border-borderSubtle rounded-lg p-3">
            <div className="flex items-center gap-2">
              <input value={f.question} onChange={(e) => handleFaq(idx, "question", e.target.value)} className="input text-[11px]" placeholder="Question" />
              <button type="button" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))} className="text-neutral-400 hover:text-red-600 p-1 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea value={f.answer} onChange={(e) => handleFaq(idx, "answer", e.target.value)} rows={2} className="input text-[11px]" placeholder="Answer" />
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-1.5">
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving..." : "Save Program Details"}
      </button>
    </form>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-borderSubtle bg-warm rounded-t-2xl">
          <h3 className="text-sm font-bold text-textMain">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-borderSubtle hover:bg-neutral-50 text-textMuted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModuleForm({
  initial,
  programId,
  onSaved,
  createModuleM,
  updateModuleM,
  token,
}: any) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (initial?._id) {
        await updateModuleM({ token, moduleId: initial._id, title, description, sortOrder: Number(sortOrder) });
      } else {
        await createModuleM({ token, programId, title, description, sortOrder: Number(sortOrder) });
      }
      onSaved(initial?._id ? "Module updated." : "Module created.");
    } catch (err: any) {
      setError(err.message || "Failed to save module.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Module Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Module 1: Digital Earning & Content Basics" required />
      </Field>
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="Short description shown in the syllabus" />
      </Field>
      <Field label="Sort Order">
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input" />
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-1.5">
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving..." : "Save Module"}
      </button>
    </form>
  );
}

function LessonForm({ initial, programId, onSaved, createLessonM, updateLessonM, token }: any) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [type, setType] = useState(initial?.type ?? "text");
  const [content, setContent] = useState(initial?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [durationMinutes, setDurationMinutes] = useState<number>(initial?.durationMinutes ?? 10);
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 1);
  const [status, setStatus] = useState(initial?.status ?? "published");
  const [isPreview, setIsPreview] = useState(initial?.isPreview ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTitle = (val: string) => {
    setTitle(val);
    if (!initial?._id) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim() || !slug.trim()) return;
    setSaving(true);
    setError("");
    try {
      const base = {
        title,
        slug,
        type,
        content,
        videoUrl: type === "video" && videoUrl ? videoUrl : undefined,
        durationMinutes: Number(durationMinutes),
        sortOrder: Number(sortOrder),
        status,
        isPreview,
      };
      if (initial?._id) {
        await updateLessonM({ token, lessonId: initial._id, ...base });
      } else {
        await createLessonM({ token, programId, moduleId: initial.moduleId, ...base });
      }
      onSaved(initial?._id ? "Lesson updated." : "Lesson created.");
    } catch (err: any) {
      setError(err.message || "Failed to save lesson.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lesson Title">
          <input value={title} onChange={(e) => handleTitle(e.target.value)} className="input" required />
        </Field>
        <Field label="Slug">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            <option value="text">Text</option>
            <option value="video">Video</option>
            <option value="download">Download</option>
            <option value="quiz">Quiz</option>
          </select>
        </Field>
        <Field label="Duration (minutes)">
          <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="input" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </Field>
        <Field label="Sort Order">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input" />
        </Field>
      </div>
      {type === "video" && (
        <Field label="Video URL (YouTube)">
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="input" placeholder="https://www.youtube.com/watch?v=... or video ID" />
        </Field>
      )}
      <Field label="Lesson Content (markdown-style)">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="input font-mono text-[11px] leading-relaxed"
          placeholder={"## Heading\n> Callout / note\n- bullet point\n1. numbered step\n**bold**, *italic*, `code`, ---"}
        />
        <p className="text-[10px] text-textMuted mt-1">
          Supports ## ### headings, &gt; callouts, - bullets, 1. steps, - [ ] checklists, --- dividers, **bold**, *italic*, `code`.
        </p>
      </Field>
      <label className="flex items-center gap-2 text-xs text-textMuted cursor-pointer select-none">
        <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="accent-brand-600" />
        Preview lesson (visible to non-enrolled users)
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-1.5">
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving..." : "Save Lesson"}
      </button>
    </form>
  );
}

function ResourceForm({
  initial,
  programId,
  onSaved,
  createResourceM,
  updateResourceM,
  uploadFile,
  uploadingFile,
  token,
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fileType, setFileType] = useState(initial?.fileType ?? "pdf");
  const [fileSize, setFileSize] = useState(initial?.fileSize ?? "");
  const [accessType, setAccessType] = useState(initial?.accessType ?? "enrolled");
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 1);
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? "");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const typeMap: Record<string, string> = {
      pdf: "pdf", doc: "doc", docx: "doc", xls: "xls", xlsx: "xls",
      zip: "zip", rar: "zip", png: "template", jpg: "template", jpeg: "template",
      mp4: "video", mov: "video", url: "link",
    };
    setFileType(typeMap[ext] ?? "pdf");
    setFileSize(file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`);
    try {
      const storageId = await uploadFile(file);
      setFileUrl(storageId);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim()) return;
    if (!fileUrl) {
      setError("Upload a file first (or provide a URL).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const base = {
        title,
        description,
        fileUrl,
        fileType,
        fileSize: fileSize || "—",
        programId,
        accessType,
        sortOrder: Number(sortOrder),
      };
      if (initial?._id) {
        await updateResourceM({ token, resourceId: initial._id, ...base });
      } else {
        await createResourceM({ token, ...base });
      }
      onSaved(initial?._id ? "Resource updated." : "Resource created.");
    } catch (err: any) {
      setError(err.message || "Failed to save resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Resource Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
      </Field>
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input" />
      </Field>

      <div>
        <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">File Upload</span>
        <div className="mt-1.5 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadingFile ? "Uploading..." : "Choose File"}
          </button>
          {fileName && (
            <span className="text-[11px] text-brand-700 font-medium truncate max-w-[220px]">{fileName}</span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <input
            value={fileUrl.startsWith("http") ? fileUrl : ""}
            onChange={(e) => setFileUrl(e.target.value)}
            className="input text-[11px]"
            placeholder="Or paste an external URL (https://...)"
          />
        </div>
        {initial?.fileUrl && !fileName && (
          <p className="text-[10px] text-textMuted mt-1">
            Current file: {initial.isStoredFile ? "uploaded file (replace by choosing a new file)" : initial.fileUrl}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Type">
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="input">
            {["pdf", "doc", "xls", "zip", "template", "video", "link"].map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </Field>
        <Field label="Access">
          <select value={accessType} onChange={(e) => setAccessType(e.target.value)} className="input">
            <option value="enrolled">Enrolled</option>
            <option value="public">Public</option>
            <option value="achievement_locked">Achievement</option>
          </select>
        </Field>
        <Field label="Sort">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="File Size">
          <input value={fileSize} onChange={(e) => setFileSize(e.target.value)} className="input" />
        </Field>
        <Field label="Downloads" hint="">
          <input value={initial?.downloadCount ?? 0} disabled className="input bg-neutral-50 text-textMuted" />
        </Field>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving || uploadingFile} className="btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-1.5">
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving..." : "Save Resource"}
      </button>
    </form>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[10px] text-textMuted mt-1">{hint}</p>}
    </div>
  );
}