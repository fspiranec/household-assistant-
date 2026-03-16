"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function NewExpensePage() {
  const [form, setForm] = useState({ amount: "", date: "", merchant: "", category: "", notes: "", household_id: "", tags: "" });

  const parseReceipt = async (file?: File) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ocr/parse", { method: "POST", body: fd });
    if (!res.ok) return;
    const data = await res.json();
    setForm((p) => ({ ...p, merchant: data.merchant ?? p.merchant, amount: String(data.total ?? p.amount), date: data.date ?? p.date }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      body: JSON.stringify({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) })
    });
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Expense Form</h1>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <Input placeholder="Household ID" value={form.household_id} onChange={(e) => setForm((p) => ({ ...p, household_id: e.target.value }))} required />
        <Input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
        <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
        <Input placeholder="Merchant" value={form.merchant} onChange={(e) => setForm((p) => ({ ...p, merchant: e.target.value }))} required />
        <Input placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
        <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
        <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="md:col-span-2" />
        <Input type="file" onChange={(e) => parseReceipt(e.target.files?.[0])} className="md:col-span-2" />
        <Button type="submit" className="w-fit">Save Expense</Button>
      </form>
    </section>
  );
}
