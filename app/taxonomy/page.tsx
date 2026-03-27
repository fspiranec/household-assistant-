"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Household } from "@/types";

type TaxonomyResponse = {
  categories: string[];
  tags: string[];
};

type TaxonomyTab = "categories" | "tags";

export default function TaxonomyPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState("");
  const [tab, setTab] = useState<TaxonomyTab>("categories");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newValue, setNewValue] = useState("");
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [message, setMessage] = useState("");

  const loadHouseholds = useCallback(async () => {
    const res = await fetch("/api/households");
    if (!res.ok) return;
    const data = (await res.json()) as Household[];
    setHouseholds(data);
    if (data.length > 0 && !householdId) setHouseholdId(data[0].id);
  }, [householdId]);

  const loadTaxonomy = useCallback(async (targetHouseholdId: string) => {
    if (!targetHouseholdId) return;
    const res = await fetch(`/api/taxonomy?household_id=${targetHouseholdId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to load taxonomy");
      return;
    }
    const payload = data as TaxonomyResponse;
    setCategories(payload.categories ?? []);
    setTags(payload.tags ?? []);
  }, []);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    if (!householdId) return;
    loadTaxonomy(householdId);
  }, [householdId, loadTaxonomy]);

  const activeValues = tab === "categories" ? categories : tags;
  const filteredValues = useMemo(
    () => activeValues.filter((value) => value.toLowerCase().includes(search.toLowerCase())),
    [activeValues, search]
  );

  const runAction = async (payload: Record<string, string>) => {
    const res = await fetch("/api/taxonomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, household_id: householdId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Taxonomy update failed");
      return;
    }
    setMessage(data.message || "Updated");
    const payloadResponse = data as TaxonomyResponse & { message: string };
    setCategories(payloadResponse.categories ?? []);
    setTags(payloadResponse.tags ?? []);
    setNewValue("");
    setMergeSource("");
    setMergeTarget("");
  };

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    runAction({ action: "add", field: tab === "categories" ? "category" : "tag", value: newValue.trim() });
  };

  const removeValue = (value: string) => {
    runAction({ action: "remove", field: tab === "categories" ? "category" : "tag", value });
  };

  const mergeValues = (e: FormEvent) => {
    e.preventDefault();
    if (!mergeSource.trim() || !mergeTarget.trim()) return;
    runAction({
      action: "merge",
      field: tab === "categories" ? "category" : "tag",
      source: mergeSource.trim(),
      target: mergeTarget.trim()
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Tag & Category Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add, remove, and merge values used across expenses for each household.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Household
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
            >
              {households.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Search {tab}
            <Input placeholder={`Search ${tab}`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "categories" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}
            onClick={() => setTab("categories")}
          >
            Categories
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "tags" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}
            onClick={() => setTab("tags")}
          >
            Tags
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={onAdd}>
          <h2 className="text-lg font-semibold">Add {tab === "categories" ? "category" : "tag"}</h2>
          <Input
            placeholder={`New ${tab === "categories" ? "category" : "tag"}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>

        <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={mergeValues}>
          <h2 className="text-lg font-semibold">Merge {tab === "categories" ? "categories" : "tags"}</h2>
          <Input list="merge-source-options" placeholder="Source value" value={mergeSource} onChange={(e) => setMergeSource(e.target.value)} />
          <Input list="merge-target-options" placeholder="Target value" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} />
          <datalist id="merge-source-options">{activeValues.map((value) => <option key={`source-${value}`} value={value} />)}</datalist>
          <datalist id="merge-target-options">{activeValues.map((value) => <option key={`target-${value}`} value={value} />)}</datalist>
          <Button type="submit">Merge</Button>
        </form>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">{tab === "categories" ? "Categories" : "Tags"} ({filteredValues.length})</h2>
        <div className="mt-4 space-y-2">
          {filteredValues.map((value) => (
            <div key={value} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-800">{value}</span>
              <button
                type="button"
                className="rounded border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                onClick={() => removeValue(value)}
              >
                Remove
              </button>
            </div>
          ))}
          {filteredValues.length === 0 && <p className="text-sm text-slate-500">No values found.</p>}
        </div>
      </section>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
