"use client";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MonthlySpendChart } from "@/components/charts/MonthlySpendChart";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";
import { Expense, ExpenseMetaResponse, ExpensesResponse, Household } from "@/types";

type Preset = "today" | "day" | "week" | "month" | "year" | "custom";

type FilterState = {
  household_id: string;
  created_by: string;
  categories: string[];
  tags: string[];
  merchants: string[];
  preset: Preset;
  start: string;
  end: string;
  day: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(preset: Preset, day: string): { start: string; end: string } {
  const now = new Date();
  if (preset === "today") {
    const d = formatDate(now);
    return { start: d, end: d };
  }
  if (preset === "day") {
    const d = day || formatDate(now);
    return { start: d, end: d };
  }
  if (preset === "week") {
    const current = new Date(now);
    const dayIndex = current.getDay();
    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: formatDate(monday), end: formatDate(sunday) };
  }
  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: formatDate(first), end: formatDate(last) };
  }

  if (preset === "year") {
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { start: formatDate(first), end: formatDate(last) };
  }

  return { start: "", end: "" };
}

function getMultiValues(event: ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [meta, setMeta] = useState<ExpenseMetaResponse>({ categories: [], tags: [], merchants: [], members: [] });
  const [filters, setFilters] = useState<FilterState>({
    household_id: "",
    created_by: "",
    categories: [],
    tags: [],
    merchants: [],
    preset: "month",
    start: "",
    end: "",
    day: formatDate(new Date())
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  useEffect(() => {
    fetch("/api/households").then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as Household[];
      setHouseholds(data);
      if (data.length > 0) {
        const household_id = data[0].id;
        setFilters((p) => ({ ...p, household_id }));
        setAppliedFilters((p) => ({ ...p, household_id }));
      }
    });
  }, []);

  useEffect(() => {
    if (!filters.household_id) return;
    fetch(`/api/expenses/meta?household_id=${filters.household_id}`).then(async (res) => {
      if (!res.ok) return;
      setMeta((await res.json()) as ExpenseMetaResponse);
    });
  }, [filters.household_id]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (appliedFilters.household_id) params.set("household_id", appliedFilters.household_id);
    if (appliedFilters.created_by) params.set("created_by", appliedFilters.created_by);
    appliedFilters.categories.forEach((category) => params.append("category", category));
    appliedFilters.tags.forEach((tag) => params.append("tag", tag));
    appliedFilters.merchants.forEach((merchant) => params.append("merchant", merchant));

    const range = appliedFilters.preset === "custom"
      ? { start: appliedFilters.start, end: appliedFilters.end }
      : getPresetRange(appliedFilters.preset, appliedFilters.day);

    if (range.start) params.set("start", range.start);
    if (range.end) params.set("end", range.end);

    fetch(`/api/expenses?${params.toString()}`).then(async (res) => {
      if (!res.ok) return;
      const payload = (await res.json()) as ExpensesResponse;
      setExpenses(payload.data ?? []);
    });
  }, [appliedFilters]);

  const applyFilters = () => setAppliedFilters(filters);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {})
  ).map(([category, categoryTotal]) => ({ category, total: categoryTotal }));

  const byMonth = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => {
      const month = new Date(e.date).toLocaleDateString(undefined, { month: "short" });
      acc[month] = (acc[month] || 0) + Number(e.amount);
      return acc;
    }, {})
  ).map(([month, monthTotal]) => ({ month, total: monthTotal }));

  const byPerson = useMemo(
    () => Object.entries(
      expenses.reduce((acc: Record<string, { total: number; count: number }>, e) => {
        const key = e.created_by;
        const current = acc[key] ?? { total: 0, count: 0 };
        current.total += Number(e.amount);
        current.count += 1;
        acc[key] = current;
        return acc;
      }, {})
    )
      .map(([userId, userStats]) => ({
        userId,
        name: meta.members.find((m) => m.id === userId)?.display_name || userId,
        ...userStats
      }))
      .sort((a, b) => b.total - a.total),
    [expenses, meta.members]
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="grid gap-2 md:grid-cols-3">
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.household_id} onChange={(e) => setFilters((p) => ({ ...p, household_id: e.target.value }))}>
            {households.length === 0 && <option value="">No households found</option>}
            {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.created_by} onChange={(e) => setFilters((p) => ({ ...p, created_by: e.target.value }))}>
            <option value="">All users</option>
            {meta.members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
          </select>
          <select multiple className="h-28 rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.categories} onChange={(e) => setFilters((p) => ({ ...p, categories: getMultiValues(e) }))}>
            {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select multiple className="h-28 rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.tags} onChange={(e) => setFilters((p) => ({ ...p, tags: getMultiValues(e) }))}>
            {meta.tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select multiple className="h-28 rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.merchants} onChange={(e) => setFilters((p) => ({ ...p, merchants: getMultiValues(e) }))}>
            {meta.merchants.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.preset} onChange={(e) => setFilters((p) => ({ ...p, preset: e.target.value as Preset }))}>
            <option value="today">Today</option>
            <option value="day">Specific day</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
            <option value="custom">Custom range</option>
          </select>
          {filters.preset === "day" && <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.day} onChange={(e) => setFilters((p) => ({ ...p, day: e.target.value }))} />}
          {filters.preset === "custom" && (
            <>
              <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.start} onChange={(e) => setFilters((p) => ({ ...p, start: e.target.value }))} />
              <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={filters.end} onChange={(e) => setFilters((p) => ({ ...p, end: e.target.value }))} />
            </>
          )}
        </div>
        <p className="text-xs text-slate-500">Tip: hold Ctrl (Windows/Linux) or Cmd (Mac) to select multiple categories, tags, and merchants.</p>
        <button type="button" onClick={applyFilters} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Apply Filters</button>
        <p className="text-lg">Total spent: ${total.toFixed(2)}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 font-semibold">Spend by Category</h2>
          <SpendByCategoryChart data={byCategory} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 font-semibold">Trend</h2>
          <MonthlySpendChart data={byMonth} />
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-3 font-semibold">People Expense Statistics (selected household)</h2>
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-right"># Expenses</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {byPerson.map((row) => (
              <tr key={row.userId} className="border-b">
                <td className="p-2">{row.name}</td>
                <td className="p-2 text-right">{row.count}</td>
                <td className="p-2 text-right">${row.total.toFixed(2)}</td>
              </tr>
            ))}
            {byPerson.length === 0 && (
              <tr>
                <td className="p-2 text-slate-500" colSpan={3}>No expenses match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
