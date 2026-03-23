"use client";
import { useEffect, useMemo, useState } from "react";
import { MonthlySpendChart } from "@/components/charts/MonthlySpendChart";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";
import { Expense, ExpenseMetaResponse, ExpensesResponse, Household } from "@/types";

type Preset = "today" | "day" | "week" | "month" | "year" | "custom";
type MultiFilterKey = "created_by" | "categories" | "tags" | "merchants";
type BreakdownDimension = "category" | "merchant" | "user" | "tag";
type TrendBucket = "day" | "week" | "month";
type TrendMetric = "total" | "count" | "average";

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

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const dayIndex = copy.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  copy.setDate(copy.getDate() + mondayOffset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatBucketLabel(date: Date, bucket: TrendBucket) {
  if (bucket === "day") {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (bucket === "week") {
    const weekStart = startOfWeek(date);
    return `Week of ${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
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
  const [breakdownDimension, setBreakdownDimension] = useState<BreakdownDimension>("category");
  const [trendBucket, setTrendBucket] = useState<TrendBucket>("day");
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("total");

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

  const breakdownChart = useMemo(() => {
    const grouped = expenses.reduce((acc: Record<string, number>, expense) => {
      if (breakdownDimension === "category") {
        const key = expense.category || "Uncategorized";
        acc[key] = (acc[key] || 0) + Number(expense.amount);
      } else if (breakdownDimension === "merchant") {
        const key = expense.merchant || "Unknown merchant";
        acc[key] = (acc[key] || 0) + Number(expense.amount);
      } else if (breakdownDimension === "user") {
        const memberName = expense.created_by_name || meta.members.find((member) => member.id === expense.created_by)?.display_name || expense.created_by;
        acc[memberName] = (acc[memberName] || 0) + Number(expense.amount);
      } else {
        const tags = expense.tags && expense.tags.length > 0 ? expense.tags : ["Untagged"];
        tags.forEach((tag) => {
          acc[tag] = (acc[tag] || 0) + Number(expense.amount);
        });
      }
      return acc;
    }, {});

    const labelMap: Record<BreakdownDimension, string> = {
      category: "Category",
      merchant: "Merchant",
      user: "User",
      tag: "Tag"
    };

    return Object.entries(grouped)
      .map(([label, chartTotal]) => ({ label, total: chartTotal }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((entry) => ({ ...entry, name: `${labelMap[breakdownDimension]}: ${entry.label}` }));
  }, [breakdownDimension, expenses, meta.members]);

  const trendData = useMemo(() => {
    const grouped = expenses.reduce((acc: Record<string, { label: string; total: number; count: number; sortValue: number }>, expense) => {
      const expenseDate = new Date(expense.date);
      let bucketKey = "";
      let sortValue = 0;

      if (trendBucket === "day") {
        bucketKey = expense.date;
        sortValue = new Date(expense.date).getTime();
      } else if (trendBucket === "week") {
        const weekStart = startOfWeek(expenseDate);
        bucketKey = formatDate(weekStart);
        sortValue = weekStart.getTime();
      } else {
        const monthDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
        bucketKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
        sortValue = monthDate.getTime();
      }

      const current = acc[bucketKey] ?? {
        label: formatBucketLabel(expenseDate, trendBucket),
        total: 0,
        count: 0,
        sortValue
      };

      current.total += Number(expense.amount);
      current.count += 1;
      current.sortValue = sortValue;
      current.label = trendBucket === "week"
        ? `Week of ${new Date(bucketKey).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : formatBucketLabel(expenseDate, trendBucket);
      acc[bucketKey] = current;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => a.sortValue - b.sortValue)
      .map((entry) => ({
        label: entry.label,
        value: trendMetric === "total"
          ? entry.total
          : trendMetric === "count"
            ? entry.count
            : entry.count > 0
              ? entry.total / entry.count
              : 0
      }));
  }, [expenses, trendBucket, trendMetric]);

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
        name: expenses.find((expense) => expense.created_by === userId)?.created_by_name || meta.members.find((m) => m.id === userId)?.display_name || userId,
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

  const breakdownTitles: Record<BreakdownDimension, string> = {
    category: "Spend by category",
    merchant: "Spend by merchant",
    user: "Spend by user",
    tag: "Spend by tag"
  };

  const trendMetricLabel: Record<TrendMetric, string> = {
    total: "Total spend",
    count: "Expense count",
    average: "Average expense"
  };

  const trendMetricFormat: Record<TrendMetric, "currency" | "number"> = {
    total: "currency",
    count: "number",
    average: "currency"
  };

  const formatExpenseHoverDetails = (expense: Expense) => {
    const tags = expense.tags && expense.tags.length > 0 ? expense.tags.join(", ") : "No tags";
    const notes = expense.notes?.trim() ? expense.notes.trim() : "No notes";
    return `Tags: ${tags}\nNotes: ${notes}`;
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <h2 className="text-sm font-medium text-slate-700">Filters</h2>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700">
              Household
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={filters.household_id}
                onChange={(e) => setFilters((p) => ({ ...p, household_id: e.target.value }))}
              >
                {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700">
              Quick range
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={filters.preset}
                onChange={(e) => setFilters((p) => ({ ...p, preset: e.target.value as Preset }))}
              >
                <option value="today">Today</option>
                <option value="day">Specific day</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700">
              Private expenses
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={filters.exclude_private ? "exclude" : "include"}
                onChange={(e) => setFilters((p) => ({ ...p, exclude_private: e.target.value === "exclude" }))}
              >
                <option value="include">Include private</option>
                <option value="exclude">Exclude private</option>
              </select>
            </label>
            {filters.preset === "day" && (
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700">
                Day
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  type="date"
                  value={filters.day}
                  onChange={(e) => setFilters((p) => ({ ...p, day: e.target.value }))}
                />
              </label>
            )}
            {filters.preset === "custom" && (
              <>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700">
                  Start
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    type="date"
                    value={filters.start}
                    onChange={(e) => setFilters((p) => ({ ...p, start: e.target.value }))}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700">
                  End
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    type="date"
                    value={filters.end}
                    onChange={(e) => setFilters((p) => ({ ...p, end: e.target.value }))}
                  />
                </label>
              </>
            )}
          </div>
          <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-4">
            {renderCheckboxGroup(
              "created_by",
              "Users",
              meta.members.map((member) => ({ value: member.id, text: member.display_name }))
            )}
            {renderCheckboxGroup(
              "categories",
              "Categories",
              meta.categories.map((category) => ({ value: category, text: category }))
            )}
            {renderCheckboxGroup(
              "tags",
              "Tags",
              meta.tags.map((tag) => ({ value: tag, text: tag }))
            )}
            {renderCheckboxGroup(
              "merchants",
              "Merchants",
              meta.merchants.map((merchant) => ({ value: merchant, text: merchant }))
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" onClick={applyFilters}>
            Apply filters
          </button>
          <p className="self-center text-sm text-slate-500">Showing {expenses.length} expenses totaling ${total.toFixed(2)}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{breakdownTitles[breakdownDimension]}</h2>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={breakdownDimension}
              onChange={(e) => setBreakdownDimension(e.target.value as BreakdownDimension)}
            >
              <option value="category">Category</option>
              <option value="merchant">Merchant</option>
              <option value="user">User</option>
              <option value="tag">Tag</option>
            </select>
          </div>
          <SpendByCategoryChart data={breakdownChart} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Trend: {trendMetricLabel[trendMetric]}</h2>
            <div className="flex gap-2">
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={trendBucket}
                onChange={(e) => setTrendBucket(e.target.value as TrendBucket)}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={trendMetric}
                onChange={(e) => setTrendMetric(e.target.value as TrendMetric)}
              >
                <option value="total">Total</option>
                <option value="count">Count</option>
                <option value="average">Average</option>
              </select>
            </div>
          </div>
          <MonthlySpendChart data={trendData} valueFormat={trendMetricFormat[trendMetric]} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Expenses included in filters</h2>
          <p className="mt-1 text-sm text-slate-500">This list matches the exact expenses used for the charts and totals above.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Merchant</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Created by</th>
                  <th className="px-3 py-2 text-left">Privacy</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="group border-b transition-colors hover:bg-slate-50 last:border-b-0"
                    title={formatExpenseHoverDetails(expense)}
                  >
                    <td className="px-3 py-2">{expense.date}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span>{expense.merchant}</span>
                        <span className="text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                          Hover row for tags & notes
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{expense.category}</td>
                    <td className="px-3 py-2">{expense.created_by_name || meta.members.find((member) => member.id === expense.created_by)?.display_name || expense.created_by}</td>
                    <td className="px-3 py-2">{expense.is_private ? "Private" : "Household"}</td>
                    <td className="px-3 py-2 text-right font-medium">${Number(expense.amount).toFixed(2)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">No expenses match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">By user</h2>
          <div className="mt-4 space-y-3">
            {byPerson.map((person) => (
              <div key={person.userId} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{person.name}</p>
                  <p className="text-sm font-semibold text-slate-900">${person.total.toFixed(2)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">{person.count} expenses</p>
              </div>
            ))}
            {byPerson.length === 0 && <p className="text-sm text-slate-500">No expense data for this filter set.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
