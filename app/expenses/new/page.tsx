"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExpenseMetaResponse, Household } from "@/types";

export default function NewExpensePage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [message, setMessage] = useState("");
  const [meta, setMeta] = useState<ExpenseMetaResponse>({ categories: [], tags: [], merchants: [], notes: [], members: [] });
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
    if (!form.household_id) {
      setMeta({ categories: [], tags: [], merchants: [], notes: [], members: [] });
      return;
    }

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

  const allTags = useMemo(() => [...new Set(selectedTags.map((tag) => tag.trim()).filter(Boolean))], [selectedTags]);

  const categoryNormalizationSuggestion = useMemo(() => {
    const current = form.category.trim();
    if (!current) return "";
    const exact = meta.categories.find((category) => category === current);
    if (exact) return "";
    return meta.categories.find((category) => category.toLowerCase() === current.toLowerCase()) || "";
  }, [form.category, meta.categories]);

  const merchantNormalizationSuggestion = useMemo(() => {
    const current = form.merchant.trim();
    if (!current) return "";
    const exact = meta.merchants.find((merchant) => merchant === current);
    if (exact) return "";
    return meta.merchants.find((merchant) => merchant.toLowerCase() === current.toLowerCase()) || "";
  }, [form.merchant, meta.merchants]);

  const tagNormalizationSuggestions = useMemo(() => {
    return allTags
      .map((tag) => {
        const normalized = meta.tags.find((existingTag) => existingTag.toLowerCase() === tag.toLowerCase());
        if (!normalized || normalized === tag) return null;
        return { entered: tag, normalized };
      })
      .filter((value): value is { entered: string; normalized: string } => Boolean(value));
  }, [allTags, meta.tags]);

  const addTag = (raw: string) => {
    const normalized = raw.trim();
    if (!normalized) return;
    setSelectedTags((prev) => [...new Set([...prev, normalized])]);
  };

  const handleHouseholdChange = (householdId: string) => {
    setTagInput("");
    setSelectedTags([]);
    setForm((p) => ({
      ...p,
      household_id: householdId,
      merchant: "",
      category: "",
      notes: ""
    }));
  };

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
    setTagInput("");
    setSelectedTags([]);
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
            onChange={(e) => handleHouseholdChange(e.target.value)}
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
          {merchantNormalizationSuggestion ? (
            <button
              type="button"
              className="w-fit text-xs text-blue-700 hover:underline"
              onClick={() => setForm((p) => ({ ...p, merchant: merchantNormalizationSuggestion }))}
            >
              Use existing merchant: {merchantNormalizationSuggestion}
            </button>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Category
          <Input list="category-options" placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
          <datalist id="category-options">{meta.categories.map((c) => <option key={c} value={c} />)}</datalist>
          {categoryNormalizationSuggestion ? (
            <button
              type="button"
              className="w-fit text-xs text-blue-700 hover:underline"
              onClick={() => setForm((p) => ({ ...p, category: categoryNormalizationSuggestion }))}
            >
              Use existing category: {categoryNormalizationSuggestion}
            </button>
          ) : null}
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
          Tags
          <div className="mt-1 flex gap-2">
            <Input
              list="tag-options"
              placeholder="Search or type tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
            />
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => {
                addTag(tagInput);
                setTagInput("");
              }}
            >
              Add tag
            </button>
          </div>
          <datalist id="tag-options">{meta.tags.map((tag) => <option key={tag} value={tag} />)}</datalist>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs"
                onClick={() => setSelectedTags((prev) => prev.filter((value) => value !== tag))}
                title="Remove tag"
              >
                {tag} ×
              </button>
            ))}
            {selectedTags.length === 0 && <span className="text-xs text-slate-500">No tags added yet.</span>}
          </div>
        </label>
        {tagNormalizationSuggestions.length > 0 ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 md:col-span-2">
            <p className="font-medium">Tag normalization suggestions</p>
            <ul className="mt-1 list-disc pl-4">
              {tagNormalizationSuggestions.map((item) => (
                <li key={`${item.entered}-${item.normalized}`}>
                  Replace &quot;{item.entered}&quot; with &quot;{item.normalized}&quot; for consistency.
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Input list="note-options" placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="md:col-span-2" />
        <datalist id="note-options">{meta.notes.map((note) => <option key={note} value={note} />)}</datalist>
        <Input type="file" onChange={(e) => parseReceipt(e.target.files?.[0])} className="md:col-span-2" />
        <Button type="submit" className="w-fit" disabled={!form.household_id}>Save Expense</Button>
      </form>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </section>
  );
}
