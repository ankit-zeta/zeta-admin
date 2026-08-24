"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { 
  Briefcase, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ChevronRight,
  UploadCloud,
  ShieldCheck,
  ShieldX,
  BadgeCheck
} from "lucide-react";

export default function AdminWorkPage() {
  const { token } = useAdminAuth();
  const jobs = useQuery(
    api.jobs.getAllJobsAdmin,
    token ? { token } : "skip"
  );
  const applications = useQuery(
    api.applications.getAllApplicationsAdmin,
    token ? { token } : "skip"
  );

  const updateAppStatusMutation = useMutation(api.applications.updateApplicationStatus);
  const updateCvStatusMutation = useMutation(api.users.updateUserCvStatus);

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("under_review");
  const [adminNotes, setAdminNotes] = useState("");
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [cvUserId, setCvUserId] = useState<string | null>(null);
  const [cvAction, setCvAction] = useState<"verified" | "rejected">("verified");
  const [cvRemarks, setCvRemarks] = useState("");

  const handleCvAction = async () => {
    if (!token || !cvUserId) return;
    setIsProcessing(true);
    setMsg("");
    try {
      await updateCvStatusMutation({
        token,
        userId: cvUserId as any,
        cvStatus: cvAction,
        remarks: cvRemarks || undefined,
      });
      setMsg(`CV marked as ${cvAction.toUpperCase()} — applicant notified.`);
      setCvUserId(null);
      setCvRemarks("");
    } catch (err: any) {
      setMsg(err.message || "Failed to update CV status.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedApp) return;

    setIsProcessing(true);
    setMsg("");

    try {
      await updateAppStatusMutation({
        token,
        applicationId: selectedApp._id,
        status: newStatus,
        adminNotes: adminNotes || undefined,
        payoutAmount: newStatus === "completed" ? (payoutAmount || selectedApp.job?.payment || 0) : undefined,
      });

      setMsg(`Application updated to "${newStatus.toUpperCase()}".`);
      setSelectedApp(null);
      setAdminNotes("");
    } catch (err: any) {
      setMsg(err.message || "Failed to update application status.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-textMain">
            Work Opportunities & Applications
          </h1>
          <p className="text-xs text-textMuted">
            Manage contract assignments, review applicant deliverables, approve milestones, and release wallet payouts.
          </p>
        </div>

        <Link href="/work/new" className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </Link>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* Posted Jobs Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-textMain">Active Job Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs === undefined ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card-surface p-6 animate-pulse space-y-3">
                <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="col-span-2 card-surface p-8 text-center text-xs text-textMuted">
              No jobs posted yet.
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job._id} className="card-surface p-6 flex flex-col justify-between space-y-4">
                {job.coverImageUrl && (
                  <img
                    src={job.coverImageUrl}
                    alt={job.title}
                    className="w-full h-28 object-cover rounded-lg border border-borderSubtle"
                  />
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {job.category}
                    </span>
                    <span className="text-sm font-bold text-textMain">
                      ₹{job.payment.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-textMain">{job.title}</h3>
                  <p className="text-xs text-textMuted line-clamp-2">{job.shortDescription}</p>

                  <div className="flex items-center gap-4 text-xs text-textMuted pt-2 border-t border-borderSubtle">
                    <span>Applicants: <strong className="text-brand-700">{job.applicantCount}</strong></span>
                    <span>Accepted: <strong className="text-textMain">{job.acceptedCount}</strong></span>
                    <span>Openings: <strong className="text-textMain">{job.openings}</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Applications Review Queue Table */}
      <div className="card-surface p-6 space-y-4">
        <h2 className="text-base font-bold text-textMain">Applicant Review Queue</h2>

        {applications === undefined ? (
          <div className="p-8 text-center animate-pulse space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-xs text-textMuted">
            No applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                  <th className="py-3 px-3 font-semibold">Applicant</th>
                  <th className="py-3 px-3 font-semibold">Opportunity</th>
                  <th className="py-3 px-3 font-semibold">Submitted Deliverable</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-textMain block">{app.user?.name || "Applicant"}</span>
                      <span className="text-[11px] text-textMuted">{app.user?.email}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block ${
                        app.user?.cvStatus === "verified"
                          ? "bg-green-100 text-green-800"
                          : app.user?.cvStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        CV: {app.user?.cvStatus || "pending"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-textMain">
                      {app.job?.title || "Job"}
                    </td>
                    <td className="py-3 px-3">
                      {app.submissionWorkUrl ? (
                        <a
                          href={app.submissionWorkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Review Work</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-neutral-400">Not Submitted</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        app.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : app.status === "accepted" || app.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : app.status === "revision_required"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}>
                        {app.status}
                      </span>
                      {app.paymentStatus === "paid" && (
                        <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                          ₹ Paid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-textMuted">
                      {new Date(app.submittedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setNewStatus(app.status);
                          setPayoutAmount(app.job?.payment || 0);
                        }}
                        className="btn-secondary text-[11px] py-1 px-2.5"
                      >
                        Review & Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-lg w-full space-y-5 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-borderSubtle pb-3">
              <div>
                <h3 className="text-base font-bold text-textMain">Review Application</h3>
                <p className="text-xs text-textMuted">{selectedApp.user?.name} — {selectedApp.job?.title}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-xs text-textMuted hover:text-textMain"
              >
                Close
              </button>
            </div>

            {/* Applicant Answers */}
            <div className="space-y-2 text-xs max-h-48 overflow-y-auto bg-neutral-50 p-3 rounded-lg border border-borderSubtle">
              <span className="font-bold text-textMain block">Applicant Responses:</span>
              {selectedApp.answers?.map((ans: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <p className="font-semibold text-textMuted">{ans.question}</p>
                  <p className="text-textMain">{ans.answer}</p>
                </div>
              ))}
              <div className="pt-1">
                <span className="font-semibold text-textMuted">Cover Note:</span>
                <p className="text-textMain">{selectedApp.coverNote}</p>
              </div>
              {selectedApp.portfolioUrl && (
                <p className="pt-1">
                  <span className="font-semibold text-textMuted">Portfolio: </span>
                  <a href={selectedApp.portfolioUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                    {selectedApp.portfolioUrl}
                  </a>
                </p>
              )}
              {selectedApp.resumeUrl && (
                <p className="pt-1">
                  <span className="font-semibold text-textMuted">CV / Resume: </span>
                  <a href={selectedApp.resumeUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                    View CV
                  </a>
                </p>
              )}
            </div>

            {/* CV verification */}
            <div className={`p-3 rounded-lg border text-xs space-y-2 ${
              selectedApp.user?.cvStatus === "verified"
                ? "bg-green-50 border-green-200"
                : selectedApp.user?.cvStatus === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-textMain flex items-center gap-1.5">
                    {selectedApp.user?.cvStatus === "verified" ? (
                      <><BadgeCheck className="w-4 h-4 text-green-600" /> CV Verified</>
                    ) : selectedApp.user?.cvStatus === "rejected" ? (
                      <><ShieldX className="w-4 h-4 text-red-600" /> CV Rejected</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4 text-amber-600" /> CV Pending Verification</>
                    )}
                  </p>
                  <p className="text-[10px] text-textMuted mt-0.5">
                    {selectedApp.user?.cvStatus === "verified"
                      ? "Eligible for work selection."
                      : "CV must be verified before this applicant can be accepted for work."}
                  </p>
                  {selectedApp.user?.cvRemarks && (
                    <p className="text-[10px] text-textMuted italic mt-1">Last remark: {selectedApp.user.cvRemarks}</p>
                  )}
                </div>
                {selectedApp.user?.cvStatus !== "verified" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCvUserId(selectedApp.user?._id);
                      setCvAction("verified");
                      setCvRemarks("");
                    }}
                    className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                  >
                    Verify CV
                  </button>
                )}
              </div>
            </div>

            {/* Full structured CV */}
            {selectedApp.cvProfile && (
              <div className="space-y-3 text-xs border-t border-borderSubtle pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-textMain">Applicant CV (structured)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    selectedApp.cvProfile.complete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedApp.cvProfile.completenessPercent}% complete
                  </span>
                </div>
                {selectedApp.cvProfile.overview && (
                  <div className="bg-neutral-50 p-3 rounded-lg border border-borderSubtle">
                    <span className="font-bold text-textMuted block mb-1">Overview:</span>
                    <p className="text-textMain whitespace-pre-wrap">{selectedApp.cvProfile.overview}</p>
                  </div>
                )}
                {selectedApp.cvProfile.experience?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-textMuted block">Experience:</span>
                    {selectedApp.cvProfile.experience.map((exp: any, i: number) => (
                      <div key={i} className="bg-neutral-50 p-2.5 rounded-lg border border-borderSubtle">
                        <p className="font-semibold text-textMain">
                          {exp.role} — {exp.company}
                        </p>
                        <p className="text-[10px] text-textMuted">
                          {exp.startDate} — {exp.current ? "Present" : exp.endDate || "—"}
                        </p>
                        {exp.description && <p className="text-[11px] text-textMuted mt-0.5">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {selectedApp.cvProfile.education?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-textMuted block">Education:</span>
                    {selectedApp.cvProfile.education.map((edu: any, i: number) => (
                      <div key={i} className="bg-neutral-50 p-2.5 rounded-lg border border-borderSubtle">
                        <p className="font-semibold text-textMain">
                          {edu.degree}{edu.field ? ` (${edu.field})` : ""} — {edu.institution}
                        </p>
                        <p className="text-[10px] text-textMuted capitalize">
                          {edu.status}
                          {edu.startYear || edu.endYear ? ` • ${edu.startYear || ""}—${edu.endYear || ""}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {(selectedApp.cvProfile.technicalSkills?.length > 0 || selectedApp.cvProfile.softSkills?.length > 0) && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-textMuted block">Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.cvProfile.technicalSkills.map((s: string) => (
                        <span key={s} className="text-[10px] font-semibold bg-brand-50 text-brand-800 border border-brand-200 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                      {selectedApp.cvProfile.softSkills.map((s: string) => (
                        <span key={s} className="text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApp.cvProfile.portfolioUrl && (
                  <p>
                    <span className="font-semibold text-textMuted">Portfolio: </span>
                    <a href={selectedApp.cvProfile.portfolioUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                      {selectedApp.cvProfile.portfolioUrl}
                    </a>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-textMain">Update Application Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-medium"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="accepted">Accepted (Assign Work)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="revision_required">Revision Required</option>
                  <option value="completed">Completed (Release Payout)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {newStatus === "completed" && (
                <div className="space-y-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <label className="font-semibold text-green-900 block">
                    Release Milestone Payout (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-green-300 bg-white font-bold text-green-900"
                  />
                  <p className="text-[10px] text-green-700">
                    This amount will be directly credited to the contractor&apos;s available wallet balance.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-textMain">Admin Reviewer Feedback / Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Feedback sent to applicant..."
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="btn-secondary py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary py-1.5 px-4"
                >
                  {isProcessing ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CV Verify / Reject Modal */}
      {cvUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-textMain">
              {cvAction === "verified" ? "Verify Applicant CV" : "Reject Applicant CV"}
            </h3>
            <p className="text-xs text-textMuted">
              {cvAction === "verified"
                ? "The applicant becomes eligible to be selected for work opportunities. Their wallet and profile stay intact."
                : "The applicant is notified and cannot be accepted for work until re-verified."}
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-textMain">Remarks (optional)</label>
              <textarea
                rows={3}
                value={cvRemarks}
                onChange={(e) => setCvRemarks(e.target.value)}
                placeholder={cvAction === "rejected" ? "Required for rejected CVs — e.g. missing document, unclear image..." : "Optional note"}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCvUserId(null)}
                className="btn-secondary py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCvAction}
                disabled={isProcessing}
                className={cvAction === "verified" ? "btn-primary py-1.5 px-4" : "py-1.5 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"}
              >
                {isProcessing ? "Saving..." : cvAction === "verified" ? "Verify CV" : "Reject CV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
