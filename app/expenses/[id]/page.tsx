"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExpenseDetail } from "@/types";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ amount: "", date: "", merchant: "", category: "", notes: "", tags: "" });

  useEffect(() => {
    fetch(`/api/expenses/${id}`).then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as ExpenseDetail;
      setExpense(data);
      setForm({
        amount: String(data.amount ?? ""),
        date: data.date ?? "",
        merchant: data.merchant ?? "",
        category: data.category ?? "",
        notes: data.notes ?? "",
        tags: (data.tags ?? []).join(", ")
      });
    });
  }, [id]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: form.amount,
        date: form.date,
        merchant: form.merchant,
        category: form.category,
        notes: form.notes,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean)
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

  if (!expense) return <p>Loading...</p>;

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Expense Detail</h1>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSave}>
        <Input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
        <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
        <Input placeholder="Merchant" value={form.merchant} onChange={(e) => setForm((p) => ({ ...p, merchant: e.target.value }))} required />
        <Input placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
        <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="md:col-span-2" />
        <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="md:col-span-2" />
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">Save Changes</Button>
          <Button type="button" className="bg-red-700 hover:bg-red-600" onClick={onDelete}>Delete Expense</Button>
          <Link href="/expenses" className="rounded-md border px-4 py-2 text-sm">Back</Link>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </section>
  );
}
