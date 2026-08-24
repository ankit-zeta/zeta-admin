"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function NewProgramPage() {
  const router = useRouter();
  const { token } = useAdminAuth();
  const createProgramMutation = useMutation(api.programs.createProgram);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(4000);
  const [compareAtPrice, setCompareAtPrice] = useState<number>(6000);
  const [duration, setDuration] = useState("8 Weeks");
  const [accessDuration, setAccessDuration] = useState("Lifetime Access");
  const [thumbnail, setThumbnail] = useState("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80");
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const [affiliateEnabled, setAffiliateEnabled] = useState(true);
const [format, setFormat] = useState("text");
const [category, setCategory] = useState("Digital Skills");

  const [inclusions, setInclusions] = useState<string[]>([
    "8 Practical Modules with Lessons",
    "Verified Certificate of Completion",
    "Work Marketplace Eligibility",
  ]);

  const [outcomes, setOutcomes] = useState<string[]>([
    "Practical digital delivery readiness",
    "Client project scoping and milestone delivery",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleAddInclusion = () => {
    setInclusions([...inclusions, ""]);
  };

  const handleAddOutcome = () => {
    setOutcomes([...outcomes, ""]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createProgramMutation({
        token,
        name,
        slug,
        shortDescription,
        description,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        status: "published",
        thumbnail,
        duration,
        accessDuration,
        certificateEnabled,
        affiliateEnabled,
        format,
        category,
        sortOrder: Number(sortOrder),
        whatIncluded: inclusions.filter(Boolean),
        outcomes: outcomes.filter(Boolean),
        faqs: [
          {
            question: "Who is this program for?",
            answer: "Learners seeking practical digital skills and direct work opportunities.",
          },
        ],
      });

      router.push("/programs");
    } catch (err: any) {
      setError(err.message || "Failed to create program.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <Link
        href="/programs"
        className="inline-flex items-center gap-1.5 text-xs text-textMuted hover:text-textMain font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Programs</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Create New Program
        </h1>
        <p className="text-xs text-textMuted">
          Configure curriculum title, pricing, access tiers, and inclusions.
        </p>
      </div>

      <div className="card-surface p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Course Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-green-600">
                <option value="text">Text-based (current default)</option>
                <option value="video">Video lessons</option>
                <option value="mixed">Text + Video</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Category / Field</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Digital Skills, Marketing, Skilled Trades..." className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">Program Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Full-Stack Digital Specialist"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. full-stack-digital-specialist"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">Tuition Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs font-bold bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">Compare At Price (₹)</label>
              <input
                type="number"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-textMain">Short Description *</label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary for cards and search..."
              className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-textMain">Full Curriculum Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed overview of syllabus, projects, and target audience..."
              className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">Program Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 8 Weeks"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMain">Thumbnail Image URL</label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle text-xs bg-white"
              />
            </div>
          </div>

          {/* Key Inclusions Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-textMain">What&apos;s Included (Bullet points)</label>
              <button
                type="button"
                onClick={handleAddInclusion}
                className="text-[11px] font-semibold text-brand-700 hover:underline"
              >
                + Add Item
              </button>
            </div>
            {inclusions.map((inc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inc}
                  onChange={(e) => {
                    const copy = [...inclusions];
                    copy[idx] = e.target.value;
                    setInclusions(copy);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-borderSubtle text-xs bg-white"
                />
                {inclusions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setInclusions(inclusions.filter((_, i) => i !== idx))}
                    className="text-neutral-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-borderSubtle flex items-center justify-end gap-3">
            <Link href="/programs" className="btn-secondary text-xs py-2 px-4">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Publish Program"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
