"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExpenseMetaResponse, Household } from "@/types";

export default function NewExpensePage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [message, setMessage] = useState("");
  const [meta, setMeta] = useState<ExpenseMetaResponse>({ categories: [], tags: [], merchants: [], members: [] });
  const [selectedTag, setSelectedTag] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [form, setForm] = useState({ amount: "", date: "", merchant: "", category: "", notes: "", household_id: "", is_private: false });

  useEffect(() => {
    fetch("/api/households").then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as Household[];
      setHouseholds(data);
      if (data.length > 0) {
        setForm((p) => ({ ...p, household_id: p.household_id || data[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    if (!form.household_id) return;
    fetch(`/api/expenses/meta?household_id=${form.household_id}`).then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as ExpenseMetaResponse;
      setMeta(data);
    });
  }, [form.household_id]);

  const parseReceipt = async (file?: File) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ocr/parse", { method: "POST", body: fd });
    if (!res.ok) return;
    const data = await res.json();
    setForm((p) => ({ ...p, merchant: data.merchant ?? p.merchant, amount: String(data.total ?? p.amount), date: data.date ?? p.date }));
  };

  const allTags = useMemo(
    () => [...new Set([selectedTag, ...customTags.split(",").map((t) => t.trim())].filter(Boolean))],
    [selectedTag, customTags]
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: allTags })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to save expense");
      return;
    }

    setMessage("Expense saved");
    setCustomTags("");
    setSelectedTag("");
    setForm((p) => ({ ...p, amount: "", date: "", merchant: "", category: "", notes: "", is_private: false }));
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Expense Form</h1>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <label className="flex flex-col gap-1 text-sm">
          Household
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.household_id}
            onChange={(e) => setForm((p) => ({ ...p, household_id: e.target.value }))}
            required
          >
            {households.length === 0 && <option value="">No households found</option>}
            {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Amount
          <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Date
          <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Merchant
          <Input list="merchant-options" placeholder="Merchant" value={form.merchant} onChange={(e) => setForm((p) => ({ ...p, merchant: e.target.value }))} required />
          <datalist id="merchant-options">{meta.merchants.map((m) => <option key={m} value={m} />)}</datalist>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Category
          <Input list="category-options" placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
          <datalist id="category-options">{meta.categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Private expense
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.is_private ? "yes" : "no"}
            onChange={(e) => setForm((p) => ({ ...p, is_private: e.target.value === "yes" }))}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Tag
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">Select existing tag</option>
            {meta.tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <Input placeholder="Additional tags (comma separated)" value={customTags} onChange={(e) => setCustomTags(e.target.value)} className="md:col-span-2" />
        <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="md:col-span-2" />
        <Input type="file" onChange={(e) => parseReceipt(e.target.files?.[0])} className="md:col-span-2" />
        <Button type="submit" className="w-fit" disabled={!form.household_id}>Save Expense</Button>
      </form>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </section>
  );
}
