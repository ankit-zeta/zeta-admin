"use client";

import React, { useMemo, useState } from "react";
import { useAdminAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import {
  Receipt,
  Plus,
  Trash2,
  Pencil,
  Tag,
  Save,
  X,
  Percent,
  Repeat,
  Search,
} from "lucide-react";

const PALETTE = [
  "#176B4D", "#D97706", "#2563EB", "#DC2626", "#7C3AED",
  "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#475569",
];

type EditingExpense = {
  _id: string;
  categoryId: string;
  description: string;
  amountRupees: number;
  date: string;
  vendor: string;
  notes: string;
  recurring: boolean;
};

function toInputDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function fromInputDate(s: string): number {
  // IST-aligned day start, matching the analytics day buckets
  return new Date(s + "T00:00:00+05:30").getTime();
}

export default function AdminExpensesPage() {
  const { token } = useAdminAuth();
  const data: any = useQuery(
    api.expensesAdmin.getExpenseDataAdmin,
    token ? { token } : "skip"
  );
  const financeSetting: any = useQuery(api.settings.getSetting, { key: "finance" });

  const addCategory = useMutation(api.expensesAdmin.addExpenseCategory);
  const deleteCategory = useMutation(api.expensesAdmin.deleteExpenseCategory);
  const addExpense = useMutation(api.expensesAdmin.addExpense);
  const updateExpense = useMutation(api.expensesAdmin.updateExpense);
  const deleteExpense = useMutation(api.expensesAdmin.deleteExpense);
  const saveSetting = useMutation(api.settings.updateSetting);

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Category form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catColor, setCatColor] = useState(PALETTE[0]);

  // Expense form
  const [expCat, setExpCat] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(toInputDate(Date.now()));
  const [expVendor, setExpVendor] = useState("");
  const [expNotes, setExpNotes] = useState("");
  const [expRecurring, setExpRecurring] = useState(false);

  // Filters
  const [filterCat, setFilterCat] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [search, setSearch] = useState("");

  // Edit state
  const [editing, setEditing] = useState<EditingExpense | null>(null);

  // Tax rate
  const [taxRate, setTaxRate] = useState("");
  const [taxSaved, setTaxSaved] = useState(false);

  const activeCategories = (data?.categories || []).filter((c: any) => !c.archived);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const e of data?.expenses || []) {
      set.add(e.date.toString().slice(0, 0) || toInputDate(e.date).slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [data]);

  const filtered = (data?.expenses || []).filter((e: any) => {
    if (filterCat !== "all" && e.categoryId !== filterCat) return false;
    if (filterMonth !== "all" && toInputDate(e.date).slice(0, 7) !== filterMonth) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.vendor?.toLowerCase().includes(q) ||
        e.categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddCategory = async () => {
    if (!token || !catName.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      await addCategory({
        token,
        name: catName,
        description: catDesc || undefined,
        color: catColor,
      });
      setCatName("");
      setCatDesc("");
      setMsg("Category added.");
    } catch (err: any) {
      setMsg(err.message || "Failed to add category");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (!token) return;
    const confirmMsg =
      cat.usageCount > 0
        ? `"${cat.name}" has ${cat.usageCount} expenses. It will be archived (history preserved). Continue?`
        : `Delete category "${cat.name}"?`;
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    setMsg("");
    try {
      await deleteCategory({ token, categoryId: cat._id });
      setMsg(cat.usageCount > 0 ? "Category archived." : "Category deleted.");
    } catch (err: any) {
      setMsg(err.message || "Failed to delete category");
    } finally {
      setBusy(false);
    }
  };

  const handleAddExpense = async () => {
    if (!token || !expCat || !expDesc.trim() || !expAmount) return;
    setBusy(true);
    setMsg("");
    try {
      await addExpense({
        token,
        categoryId: expCat as any,
        description: expDesc,
        amountRupees: Number(expAmount),
        date: fromInputDate(expDate),
        vendor: expVendor || undefined,
        notes: expNotes || undefined,
        recurring: expRecurring || undefined,
      });
      setExpDesc("");
      setExpAmount("");
      setExpVendor("");
      setExpNotes("");
      setExpRecurring(false);
      setMsg("Expense recorded.");
    } catch (err: any) {
      setMsg(err.message || "Failed to record expense");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (e: any) => {
    setEditing({
      _id: e._id,
      categoryId: e.categoryId,
      description: e.description,
      amountRupees: e.amount / 100,
      date: toInputDate(e.date),
      vendor: e.vendor || "",
      notes: e.notes || "",
      recurring: !!e.recurring,
    });
  };

  const handleSaveEdit = async () => {
    if (!token || !editing) return;
    setBusy(true);
    setMsg("");
    try {
      await updateExpense({
        token,
        expenseId: editing._id as any,
        categoryId: editing.categoryId as any,
        description: editing.description,
        amountRupees: Number(editing.amountRupees),
        date: fromInputDate(editing.date),
        vendor: editing.vendor || undefined,
        notes: editing.notes || undefined,
        recurring: editing.recurring || undefined,
      });
      setEditing(null);
      setMsg("Expense updated.");
    } catch (err: any) {
      setMsg(err.message || "Failed to update expense");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteExpense = async (e: any) => {
    if (!token) return;
    if (!window.confirm(`Delete expense "${e.description}" (${fmt(e.amount)})?`)) return;
    setBusy(true);
    setMsg("");
    try {
      await deleteExpense({ token, expenseId: e._id });
      setMsg("Expense deleted.");
    } catch (err: any) {
      setMsg(err.message || "Failed to delete expense");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveTax = async () => {
    if (!token || taxRate === "") return;
    setBusy(true);
    setMsg("");
    try {
      await saveSetting({
        token,
        key: "finance",
        value: { effectiveTaxRatePct: Number(taxRate) },
        reason: "Profit-after-tax rate update",
      });
      setTaxRate("");
      setTaxSaved(true);
      setTimeout(() => setTaxSaved(false), 3000);
      setMsg("");
    } catch (err: any) {
      setMsg(err.message || "Failed to save tax rate");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const maxCatTotal = Math.max(1, ...(data?.byCategory || []).map((c: any) => c.total));
  const currentTaxRate =
    taxRate !== "" ? taxRate : financeSetting?.effectiveTaxRatePct ?? 25;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-textMain">Expenses</h1>
        <p className="text-xs text-textMuted">
          Operating costs (server, email, events, tools…) feeding the dashboard's
          profit-after-tax calculation.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800">
          {msg}
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">This Month</p>
            <p className="text-xl font-extrabold text-amber-700 mt-1">{fmt(data.stats.thisMonth)}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">All Time</p>
            <p className="text-xl font-extrabold text-textMain mt-1">{fmt(data.stats.totalAllTime)}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Entries</p>
            <p className="text-xl font-extrabold text-textMain mt-1">{data.stats.count}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Categories</p>
            <p className="text-xl font-extrabold text-textMain mt-1">{activeCategories.length}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add expense form */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-sm font-bold text-textMain flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-brand-600" /> Record Expense
          </h3>
          <div className="space-y-3 text-xs">
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Category *</span>
              <select
                value={expCat}
                onChange={(e) => setExpCat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              >
                <option value="">Select category…</option>
                {activeCategories.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Description *</span>
              <input
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="e.g. AWS server — August"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Amount (₹) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Date *</span>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Vendor</span>
              <input
                value={expVendor}
                onChange={(e) => setExpVendor(e.target.value)}
                placeholder="e.g. AWS / Zoho / Event venue"
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Notes</span>
              <textarea
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white resize-none"
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={expRecurring}
                onChange={(e) => setExpRecurring(e.target.checked)}
                className="accent-brand-600"
              />
              <span className="flex items-center gap-1 text-textMuted font-semibold">
                <Repeat className="w-3.5 h-3.5" /> Recurring (monthly cost)
              </span>
            </label>
            <button
              onClick={handleAddExpense}
              disabled={busy || !expCat || !expDesc.trim() || !expAmount}
              className="btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {busy ? "Saving…" : "Record Expense"}
            </button>
          </div>
        </div>

        {/* Categories + tax */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category manager */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-bold text-textMain flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-600" /> Custom Categories
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Category name (e.g. Server, Emails, Events)"
                className="flex-1 px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
              <input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Description (optional)"
                className="flex-1 px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
              <div className="flex items-center gap-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      catColor === c ? "scale-110 border-textMain" : "border-transparent"
                    }`}
                    style={{ background: c }}
                    aria-label={`color ${c}`}
                  />
                ))}
              </div>
              <button
                onClick={handleAddCategory}
                disabled={busy || !catName.trim()}
                className="btn-primary py-2 px-3 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(data?.categories || []).map((c: any) => (
                <span
                  key={c._id}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    c.archived
                      ? "bg-neutral-100 text-neutral-400 border-neutral-200 line-through"
                      : "bg-white text-textMain border-borderSubtle"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color || "#8A8A8A" }} />
                  {c.name}
                  <span className="text-[9px] text-textMuted font-normal">({c.usageCount})</span>
                  <button
                    onClick={() => handleDeleteCategory(c)}
                    disabled={busy}
                    className="ml-0.5 text-neutral-400 hover:text-red-600"
                    title={c.usageCount > 0 ? "Archive (in use)" : "Delete"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {data && data.categories.length === 0 && (
                <span className="text-xs text-textMuted">No categories yet — add your first above.</span>
              )}
            </div>
          </div>

          {/* By-category bars */}
          {data && data.byCategory.length > 0 && (
            <div className="card-surface p-6 space-y-3">
              <h3 className="text-sm font-bold text-textMain">Spend by Category (all time)</h3>
              {data.byCategory.map((c: any) => (
                <div key={c._id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-textMuted font-semibold">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-bold text-textMain">{fmt(c.total)}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.total / maxCatTotal) * 100}%`, background: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tax rate config */}
          <div className="card-surface p-6 space-y-3">
            <h3 className="text-sm font-bold text-textMain flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-brand-600" /> Profit Tax Rate
            </h3>
            <p className="text-[11px] text-textMuted">
              Effective income-tax rate applied to profit-before-tax for the dashboard's
              "Profit After Tax" figure. This is an estimate — adjust with your CA.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder={String(currentTaxRate)}
                className="w-28 px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
              />
              <span className="font-bold text-textMain">%</span>
              <button
                onClick={handleSaveTax}
                disabled={busy || taxRate === ""}
                className="btn-secondary py-2 px-3 font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {taxSaved ? "Saved!" : "Save Rate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expense table */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-textMain">Expense History</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 rounded-lg border border-borderSubtle bg-white"
            >
              <option value="all">All categories</option>
              {(data?.categories || []).map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-borderSubtle bg-white"
            >
              <option value="all">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-2 rounded-lg border border-borderSubtle bg-white w-44"
              />
            </div>
          </div>
        </div>

        {data === undefined ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-textMuted">No expenses match the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-borderSubtle text-textMuted bg-neutral-50">
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Description</th>
                  <th className="py-3 px-3 font-semibold">Vendor</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {filtered.map((e: any) => (
                  <tr key={e._id} className="hover:bg-neutral-50/60">
                    <td className="py-2.5 px-3 text-textMuted whitespace-nowrap">
                      {toInputDate(e.date)}
                      {e.recurring && (
                        <span title="Recurring" className="inline-flex ml-1 align-middle">
                          <Repeat className="w-3 h-3 text-brand-500" />
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-textMain">
                        <span className="w-2 h-2 rounded-full" style={{ background: e.categoryColor }} />
                        {e.categoryName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-textMain">
                      {e.description}
                      {e.notes && <p className="text-[10px] text-textMuted italic">{e.notes}</p>}
                    </td>
                    <td className="py-2.5 px-3 text-textMuted">{e.vendor || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-textMain whitespace-nowrap">
                      {fmt(e.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(e)}
                          disabled={busy}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e)}
                          disabled={busy}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card-surface p-6 max-w-md w-full space-y-4 bg-white shadow-2xl text-xs">
            <h3 className="text-base font-bold text-textMain">Edit Expense</h3>
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Category</span>
              <select
                value={editing.categoryId}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              >
                {activeCategories.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Description</span>
              <input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Amount (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.amountRupees}
                  onChange={(e) => setEditing({ ...editing, amountRupees: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white font-bold"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-textMain">Date</span>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="font-semibold text-textMain">Vendor</span>
              <input
                value={editing.vendor}
                onChange={(e) => setEditing({ ...editing, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-borderSubtle bg-white"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="btn-secondary py-1.5 px-3">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={busy}
                className="btn-primary py-1.5 px-4 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
