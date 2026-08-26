"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  MessageSquare,
  Plus,
  Send,
  Mail,
  Megaphone,
  LifeBuoy,
  Search,
  ShieldCheck,
  User,
  CheckCircle2,
  X,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  courses: "Courses & Programs",
  duration: "Course Duration / Access",
  payments: "Payments & Refunds",
  withdrawals: "Withdrawal Request",
  jobs: "Jobs & Work Portal",
  affiliate: "Affiliate & Referrals",
  account: "Account & Profile",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-neutral-200 text-neutral-700",
};

function AttachmentList({ attachments }: { attachments: any }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((a: any, i: number) =>
        a.type === "image" ? (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            title={a.name || "Attachment image"}
            className="block w-24 h-24 rounded-lg border border-borderSubtle overflow-hidden hover:opacity-80 transition-opacity bg-white"
          >
            <img src={a.url} alt={a.name || "Attachment"} className="w-full h-full object-cover" />
          </a>
        ) : (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-borderSubtle rounded-lg text-[11px] font-semibold text-brand-700 hover:bg-brand-50 max-w-full"
          >
            <span className="truncate">{a.name || a.url}</span>
          </a>
        )
      )}
    </div>
  );
}

export default function AdminCommunicationsPage() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<"tickets" | "announcements">("tickets");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tickets = useQuery(
    api.supportTickets.getSupportTickets,
    token ? { token } : "skip"
  ) as Array<{
    _id: string;
    _creationTime: number;
    trackingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    category: string;
    title: string;
    message: string;
    status: string;
    attachments: Array<{ type: string; url: string; name?: string }> | undefined;
    createdAt: number;
    updatedAt: number;
  }> | undefined;
  const selectedDetail = useQuery(
    api.supportTickets.getSupportTicketDetail,
    token && selectedId ? { token, ticketId: selectedId as any } : "skip"
  ) as {
    ticket: {
      _id: string;
      _creationTime: number;
      trackingId: string;
      userId: string;
      userName: string;
      userEmail: string;
      category: string;
      title: string;
      message: string;
      status: string;
      attachments: Array<{ type: string; url: string; name?: string }> | undefined;
      createdAt: number;
      updatedAt: number;
    };
    messages: Array<{
      _id: string;
      _creationTime: number;
      ticketId: string;
      sender: "user" | "admin";
      senderName: string;
      message: string;
      attachments: Array<{ type: string; url: string; name?: string }> | undefined;
      createdAt: number;
    }>;
  } | undefined;

  const adminReply = useMutation(api.supportTickets.adminReplyTicket);
  const updateStatus = useMutation(api.supportTickets.updateTicketStatus);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [msg, setMsg] = useState("");

  const announcements = useQuery(api.notifications.getActiveAnnouncements) as Array<{
    _id: string;
    _creationTime: number;
    title: string;
    content: string;
    targetRole: string;
    isActive: boolean;
    priority: string;
    createdAt: number;
  }> | undefined;
  const createAnnouncementMutation = useMutation(api.notifications.createAnnouncement);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState("high");
  const [annTarget, setAnnTarget] = useState("all");
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  const filteredTickets =
    tickets?.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !t.trackingId.toLowerCase().includes(q) &&
          !t.title.toLowerCase().includes(q) &&
          !t.userName.toLowerCase().includes(q) &&
          !t.userEmail.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    }) ?? [];

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedId || !replyText.trim()) return;
    setIsSending(true);
    setMsg("");
    try {
      await adminReply({ token, ticketId: selectedId as any, message: replyText });
      setReplyText("");
      setMsg("Reply sent to the user. They will get a notification.");
    } catch (err: any) {
      setMsg(err.message || "Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!token || !selectedId) return;
    try {
      await updateStatus({ token, ticketId: selectedId as any, status });
      setMsg(`Status updated to ${status.replace(/_/g, " ")}.`);
    } catch (err: any) {
      setMsg(err.message || "Failed to update status.");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !annTitle || !annContent) return;
    setIsSubmittingAnn(true);
    setMsg("");
    try {
      await createAnnouncementMutation({
        token,
        title: annTitle,
        content: annContent,
        priority: annPriority,
        targetRole: annTarget,
      });
      setMsg("Announcement broadcasted successfully.");
      setAnnTitle("");
      setAnnContent("");
    } catch (err: any) {
      setMsg(err.message || "Failed to publish announcement.");
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const ticket = selectedDetail?.ticket;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">
          Communications & Support
        </h1>
        <p className="text-xs text-textMuted">
          Manage support tickets, reply to users, and broadcast platform announcements.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("tickets")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            tab === "tickets"
              ? "bg-brand-600 text-white"
              : "bg-white border border-borderSubtle text-textMuted hover:text-textMain"
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          Support Tickets
          {tickets ? (
            <span className={`px-1.5 rounded ${tab === "tickets" ? "bg-white/20" : "bg-brand-50 text-brand-700"}`}>
              {tickets.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setTab("announcements")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            tab === "announcements"
              ? "bg-brand-600 text-white"
              : "bg-white border border-borderSubtle text-textMuted hover:text-textMain"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Announcements
        </button>
      </div>

      {tab === "tickets" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* Ticket List */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-textMain">Incoming Tickets</h3>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-borderSubtle bg-white text-xs font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-borderSubtle bg-white text-xs font-medium"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tracking ID, title, user, email..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-borderSubtle bg-white text-xs"
              />
            </div>

            {tickets === undefined ? (
              <div className="p-8 text-center animate-pulse space-y-3">
                <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto" />
                <h4 className="text-sm font-semibold text-textMain">No tickets found</h4>
                <p className="text-xs text-textMuted">Tickets raised by users will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {filteredTickets.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setSelectedId(t._id.toString())}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      selectedId === t._id.toString()
                        ? "bg-brand-50 border-brand-300"
                        : "bg-neutral-50 border-borderSubtle hover:border-brand-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[11px] font-bold text-brand-700 bg-white border border-brand-100 px-2 py-0.5 rounded">
                        {t.trackingId}
                      </code>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_STYLES[t.status] || STATUS_STYLES.open}`}
                      >
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-textMain mt-2">{t.title}</h4>
                    <p className="text-xs text-textMuted mt-1 line-clamp-2">{t.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-textMuted">
                        <strong className="text-textMain">{t.userName}</strong> · {t.userEmail}
                      </span>
                      <span className="text-[10px] text-textMuted shrink-0 ml-2">
                        {new Date(t.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide">
                        {CATEGORY_LABELS[t.category] || t.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Detail / Conversation */}
          <div className="card-surface p-6 space-y-4">
            {!ticket ? (
              <div className="text-center py-16 space-y-2">
                <LifeBuoy className="w-10 h-10 text-neutral-300 mx-auto" />
                <h4 className="text-sm font-semibold text-textMain">Select a ticket</h4>
                <p className="text-xs text-textMuted">
                  Choose a ticket from the list to view the full conversation and reply.
                </p>
              </div>
            ) : selectedDetail === undefined ? (
              <div className="p-8 text-center animate-pulse space-y-3">
                <div className="h-6 bg-neutral-200 rounded w-1/2 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-bold text-brand-700 tracking-wider">
                        {ticket.trackingId}
                      </code>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[ticket.status] || STATUS_STYLES.open}`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-textMain mt-1.5">{ticket.title}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded uppercase">
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </span>
                      <span className="text-[10px] text-textMuted">
                        {ticket.userName} · {ticket.userEmail}
                      </span>
                      <span className="text-[10px] text-textMuted">
                        Raised {new Date(ticket.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1.5 rounded-lg text-textMuted hover:bg-neutral-100 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <AttachmentList attachments={ticket.attachments} />

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {selectedDetail.messages.map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${m.sender === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs ${
                          m.sender === "admin"
                            ? "bg-brand-600 text-white rounded-br-md"
                            : "bg-neutral-100 border border-borderSubtle text-textMain rounded-bl-md"
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 mb-1.5 ${m.sender === "admin" ? "justify-end" : ""}`}>
                          {m.sender === "user" && <User className="w-3 h-3 text-neutral-500" />}
                          {m.sender === "admin" && <ShieldCheck className="w-3 h-3 text-white/80" />}
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${m.sender === "admin" ? "text-white/80" : "text-brand-700"}`}>
                            {m.sender === "admin" ? "You" : m.senderName}
                          </span>
                          <span className={`text-[10px] ${m.sender === "admin" ? "text-white/60" : "text-textMuted"}`}>
                            {new Date(m.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        <AttachmentList attachments={m.attachments} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status control */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-textMuted">Set status:</span>
                  {["open", "in_progress", "resolved", "closed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        ticket.status === s
                          ? "bg-brand-600 text-white"
                          : "bg-neutral-100 text-textMuted hover:bg-neutral-200"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                {/* Admin reply */}
                <form onSubmit={handleAdminReply} className="space-y-2">
                  <textarea
                    rows={3}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply to the user — they will receive a notification..."
                    className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="btn-primary px-4 py-2 flex items-center gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? "Sending..." : "Send Reply to User"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "announcements" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-textMain">Broadcast Announcement</h3>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-textMain">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. New High-Ticket Client Contracts Added"
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-textMain">Priority Level</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-textMain">Target Audience</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                  >
                    <option value="all">All Members</option>
                    <option value="user">Students & Contractors</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-textMain">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Detailed broadcast text..."
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAnn}
                className="btn-primary py-2 px-4 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingAnn ? "Broadcasting..." : "Broadcast Announcement"}</span>
              </button>
            </form>
          </div>

          <div className="card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-textMain">Active Platform Announcements</h3>
            <div className="space-y-3">
              {announcements === undefined ? (
                <div className="p-4 animate-pulse space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ) : announcements.length === 0 ? (
                <p className="text-xs text-textMuted py-4 text-center">No active announcements.</p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a._id}
                    className="p-4 bg-neutral-50 rounded-lg border border-borderSubtle space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-textMain">{a.title}</span>
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded uppercase">
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-textMuted leading-relaxed">{a.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Inquiries */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-brand-600" />
          <h3 className="text-base font-bold text-textMain">Contact Form Inquiries</h3>
        </div>
        <ContactInquiriesTable />
      </div>
    </div>
  );
}

function ContactInquiriesTable() {
  const { token } = useAdminAuth();
  const inquiries = useQuery(
    api.contact.getContactInquiries,
    token ? { token } : "skip"
  ) as Array<{
    _id: string;
    _creationTime: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: number;
  }> | undefined;
  const updateInquiryStatusMutation = useMutation(api.contact.updateInquiryStatus);

  const handleResolve = async (id: any) => {
    if (!token) return;
    try {
      await updateInquiryStatusMutation({ token, inquiryId: id, status: "resolved" });
    } catch {
      // List re-syncs from the server — stay quiet, no internals in console.
    }
  };

  if (inquiries === undefined) {
    return (
      <div className="p-8 text-center animate-pulse space-y-3">
        <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return <div className="text-center py-8 text-xs text-textMuted">No contact inquiries received.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
            <th className="py-3 px-3 font-semibold">Sender</th>
            <th className="py-3 px-3 font-semibold">Subject</th>
            <th className="py-3 px-3 font-semibold">Message</th>
            <th className="py-3 px-3 font-semibold">Status</th>
            <th className="py-3 px-3 font-semibold">Date</th>
            <th className="py-3 px-3 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borderSubtle">
          {inquiries.map((inq) => (
            <tr key={inq._id} className="hover:bg-neutral-50/60 transition-colors">
              <td className="py-3 px-3">
                <span className="font-bold text-textMain block">{inq.name}</span>
                <span className="text-[11px] text-textMuted">{inq.email}</span>
              </td>
              <td className="py-3 px-3 font-medium text-textMain">{inq.subject}</td>
              <td className="py-3 px-3 text-textMuted max-w-sm">{inq.message}</td>
              <td className="py-3 px-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    inq.status === "resolved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {inq.status}
                </span>
              </td>
              <td className="py-3 px-3 text-textMuted">
                {new Date(inq.createdAt).toLocaleDateString("en-IN")}
              </td>
              <td className="py-3 px-3 text-right">
                {inq.status !== "resolved" && (
                  <button
                    onClick={() => handleResolve(inq._id)}
                    className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold hover:bg-green-100 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}