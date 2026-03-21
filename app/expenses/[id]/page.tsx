"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExpenseDetail, ExpenseMetaResponse, Household } from "@/types";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [meta, setMeta] = useState<ExpenseMetaResponse>({ categories: [], tags: [], merchants: [], members: [] });
  const [message, setMessage] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [form, setForm] = useState({
    household_id: "",
    amount: "",
    date: "",
    merchant: "",
    category: "",
    notes: "",
    is_private: false
  });

  useEffect(() => {
    fetch("/api/households").then(async (res) => {
      if (!res.ok) return;
      setHouseholds((await res.json()) as Household[]);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/expenses/${id}`).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Failed to load expense");
        return;
      }

      const expenseData = data as ExpenseDetail;
      setExpense(expenseData);
      setSelectedTag((expenseData.tags ?? [])[0] ?? "");
      setCustomTags((expenseData.tags ?? []).slice(1).join(", "));
      setForm({
        household_id: expenseData.household_id,
        amount: String(expenseData.amount ?? ""),
        date: expenseData.date ?? "",
        merchant: expenseData.merchant ?? "",
        category: expenseData.category ?? "",
        notes: expenseData.notes ?? "",
        is_private: Boolean(expenseData.is_private)
      });
    });
  }, [id]);

  useEffect(() => {
    if (!form.household_id) return;
    fetch(`/api/expenses/meta?household_id=${form.household_id}`).then(async (res) => {
      if (!res.ok) return;
      setMeta((await res.json()) as ExpenseMetaResponse);
    });
  }, [form.household_id]);

  const allTags = useMemo(
    () => [...new Set([selectedTag, ...customTags.split(",").map((tag) => tag.trim())].filter(Boolean))],
    [selectedTag, customTags]
  );

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        household_id: form.household_id,
        amount: form.amount,
        date: form.date,
        merchant: form.merchant,
        category: form.category,
        notes: form.notes,
        is_private: form.is_private,
        tags: allTags
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to update expense");
      return;
    }

    setExpense(data as ExpenseDetail);
    setMessage("Expense updated");
  };

  const onDelete = async () => {
    const confirmed = window.confirm("Delete this expense?");
    if (!confirmed) return;

    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to delete expense");
      return;
    }

    router.replace("/expenses");
    router.refresh();
  };

  if (message && !expense) return <p>{message}</p>;
  if (!expense) return <p>Loading...</p>;

  const canEdit = Boolean(expense.can_edit);

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Expense Detail</h1>
      <p className="mt-1 text-sm text-slate-500">Created by: {expense.created_by_name ?? expense.created_by}</p>
      <p className="mt-1 text-sm text-slate-500">
        {canEdit ? "You can edit this expense because you created it." : "Only the expense creator can edit or delete this expense."}
      </p>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSave}>
        <label className="flex flex-col gap-1 text-sm">
          Household
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.household_id}
            onChange={(e) => setForm((p) => ({ ...p, household_id: e.target.value }))}
            required
            disabled={!canEdit}
          >
            {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Amount
          <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required disabled={!canEdit} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Date
          <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required disabled={!canEdit} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Merchant
          <Input list="merchant-options" value={form.merchant} onChange={(e) => setForm((p) => ({ ...p, merchant: e.target.value }))} required disabled={!canEdit} />
          <datalist id="merchant-options">{meta.merchants.map((merchant) => <option key={merchant} value={merchant} />)}</datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Category
          <Input list="category-options" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required disabled={!canEdit} />
          <datalist id="category-options">{meta.categories.map((category) => <option key={category} value={category} />)}</datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Private expense
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.is_private ? "yes" : "no"}
            onChange={(e) => setForm((p) => ({ ...p, is_private: e.target.value === "yes" }))}
            disabled={!canEdit}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Tag
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            disabled={!canEdit}
          >
            <option value="">Select existing tag</option>
            {meta.tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </label>
        <Input placeholder="Additional tags (comma separated)" value={customTags} onChange={(e) => setCustomTags(e.target.value)} className="md:col-span-2" disabled={!canEdit} />
        <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="md:col-span-2" disabled={!canEdit} />
        <div className="flex gap-2 md:col-span-2">
          {canEdit && <Button type="submit">Save Changes</Button>}
          {canEdit && <Button type="button" className="bg-red-700 hover:bg-red-600" onClick={onDelete}>Delete Expense</Button>}
          <Link href="/expenses" className="rounded-md border px-4 py-2 text-sm">Back</Link>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </section>
  );
}
