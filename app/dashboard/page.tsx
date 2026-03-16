"use client";
import { useEffect, useMemo, useState } from "react";
import { MonthlySpendChart } from "@/components/charts/MonthlySpendChart";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";
import { Expense, ExpenseMetaResponse, ExpensesResponse, Household } from "@/types";

type Preset = "today" | "day" | "week" | "month" | "year" | "custom";
type MultiFilterKey = "created_by" | "categories" | "tags" | "merchants";

type FilterState = {
  household_id: string;
  created_by: string[];
  categories: string[];
  tags: string[];
  merchants: string[];
  exclude_private: boolean;
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

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [meta, setMeta] = useState<ExpenseMetaResponse>({ categories: [], tags: [], merchants: [], members: [] });
  const [filters, setFilters] = useState<FilterState>({
    household_id: "",
    created_by: [],
    categories: [],
    tags: [],
    merchants: [],
    exclude_private: false,
    preset: "month",
    start: "",
    end: "",
    day: formatDate(new Date())
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  const allOptions = {
    created_by: meta.members.map((m) => m.id),
    categories: meta.categories,
    tags: meta.tags,
    merchants: meta.merchants
  };

  const setAll = (key: MultiFilterKey) => setFilters((p) => ({ ...p, [key]: allOptions[key] }));
  const setNone = (key: MultiFilterKey) => setFilters((p) => ({ ...p, [key]: [] }));
  const setOnly = (key: MultiFilterKey, value: string) => setFilters((p) => ({ ...p, [key]: [value] }));
  const toggleValue = (key: MultiFilterKey, value: string) => {
    setFilters((p) => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter((v) => v !== value)
        : [...p[key], value]
    }));
  };

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
      const payload = (await res.json()) as ExpenseMetaResponse;
      setMeta(payload);

      const allUserIds = payload.members.map((m) => m.id);
      const allCategories = payload.categories;
      const allTags = payload.tags;
      const allMerchants = payload.merchants;

      setFilters((p) => ({
        ...p,
        created_by: allUserIds,
        categories: allCategories,
        tags: allTags,
        merchants: allMerchants
      }));
      setAppliedFilters((p) => ({
        ...p,
        created_by: allUserIds,
        categories: allCategories,
        tags: allTags,
        merchants: allMerchants
      }));
    });
  }, [filters.household_id]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (appliedFilters.household_id) params.set("household_id", appliedFilters.household_id);
    appliedFilters.created_by.forEach((userId) => params.append("created_by", userId));
    appliedFilters.categories.forEach((category) => params.append("category", category));
    appliedFilters.tags.forEach((tag) => params.append("tag", tag));
    appliedFilters.merchants.forEach((merchant) => params.append("merchant", merchant));
    if (appliedFilters.exclude_private) params.set("exclude_private", "true");

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

  const renderCheckboxGroup = (
    key: MultiFilterKey,
    label: string,
    options: { value: string; text: string }[]
  ) => (
    <div className="flex min-w-[220px] flex-col gap-1 rounded-md border border-slate-200 p-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <span className="text-[11px] text-slate-500">{filters[key].length}/{options.length}</span>
      </div>
      <div className="flex gap-1 text-[11px]">
        <button type="button" className="rounded border px-2 py-0.5" onClick={() => setAll(key)}>Select all</button>
        <button type="button" className="rounded border px-2 py-0.5" onClick={() => setNone(key)}>Unselect all</button>
      </div>
      <div className="max-h-24 space-y-1 overflow-y-auto pt-1">
        {options.map((option) => (
          <div key={option.value} className="flex items-center justify-between gap-2 text-xs">
            <label className="flex items-center gap-2 truncate">
              <input
                type="checkbox"
                checked={filters[key].includes(option.value)}
                onChange={() => toggleValue(key, option.value)}
              />
              <span className="truncate">{option.text}</span>
            </label>
            <button type="button" className="rounded border px-1.5 py-0.5 text-[11px]" onClick={() => setOnly(key, option.value)}>
              Only
            </button>
          </div>
        ))}
        {options.length === 0 && <p className="text-xs text-slate-400">No options</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <h2 className="text-sm font-medium text-slate-700">Filters</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-start gap-2">
            <label className="flex min-w-[170px] flex-col gap-1 text-xs font-medium text-slate-700">
              Household
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.household_id} onChange={(e) => setFilters((p) => ({ ...p, household_id: e.target.value }))}>
                {households.length === 0 && <option value="">No households found</option>}
                {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </label>

            {renderCheckboxGroup("created_by", "Users", meta.members.map((m) => ({ value: m.id, text: m.display_name })))}
            {renderCheckboxGroup("categories", "Categories", meta.categories.map((c) => ({ value: c, text: c })))}
            {renderCheckboxGroup("tags", "Tags", meta.tags.map((t) => ({ value: t, text: t })))}
            {renderCheckboxGroup("merchants", "Merchants", meta.merchants.map((m) => ({ value: m, text: m })))}

            <label className="flex min-w-[130px] flex-col gap-1 text-xs font-medium text-slate-700">
              Time frame
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.preset} onChange={(e) => setFilters((p) => ({ ...p, preset: e.target.value as Preset }))}>
                <option value="today">Today</option>
                <option value="day">Specific day</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
                <option value="custom">Custom range</option>
              </select>
            </label>
            {filters.preset === "day" && (
              <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-slate-700">
                Day
                <input type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.day} onChange={(e) => setFilters((p) => ({ ...p, day: e.target.value }))} />
              </label>
            )}
            {filters.preset === "custom" && (
              <>
                <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-slate-700">
                  Start
                  <input type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.start} onChange={(e) => setFilters((p) => ({ ...p, start: e.target.value }))} />
                </label>
                <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-slate-700">
                  End
                  <input type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.end} onChange={(e) => setFilters((p) => ({ ...p, end: e.target.value }))} />
                </label>
              </>
            )}
            <label className="flex min-w-[130px] flex-col gap-1 text-xs font-medium text-slate-700">
              Exclude private
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={filters.exclude_private ? "yes" : "no"} onChange={(e) => setFilters((p) => ({ ...p, exclude_private: e.target.value === "yes" }))}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        </div>
        <div>
          <button type="button" onClick={applyFilters} className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700">Apply</button>
        </div>
        <p className="text-xs text-slate-500">Use Select all / Unselect all for each group. Use Only on a row to keep just that option and unselect others.</p>
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
