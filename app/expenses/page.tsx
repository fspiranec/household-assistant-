"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Expense, ExpenseFilters, ExpensesResponse, Household } from "@/types";

function toSearchParams(filters: ExpenseFilters & { household_id: string }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export default function ExpensesPage() {
  const [data, setData] = useState<Expense[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters & { household_id: string }>({
    household_id: "",
    start: "",
    end: "",
    category: "",
    tag: ""
  });

  useEffect(() => {
    fetch("/api/households").then(async (res) => {
      if (!res.ok) return;
      const householdData = (await res.json()) as Household[];
      setHouseholds(householdData);
      if (householdData.length > 0) {
        setFilters((p) => ({ ...p, household_id: p.household_id || householdData[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    const params = toSearchParams(filters);
    fetch(`/api/expenses?${params.toString()}`).then(async (res) => {
      if (!res.ok) return;
      const payload = (await res.json()) as ExpensesResponse;
      setData(payload.data ?? []);
    });
  }, [filters]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Expense List</h1>
      <div className="grid gap-2 md:grid-cols-5">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.household_id}
          onChange={(e) => setFilters((p) => ({ ...p, household_id: e.target.value }))}
        >
          {households.length === 0 && <option value="">No households found</option>}
          {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <Input
          type="date"
          value={filters.start}
          onChange={(e) => setFilters((p) => ({ ...p, start: e.target.value }))}
        />
        <Input
          type="date"
          value={filters.end}
          onChange={(e) => setFilters((p) => ({ ...p, end: e.target.value }))}
        />
        <Input
          placeholder="Category"
          value={filters.category}
          onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
        />
        <Input
          placeholder="Tag"
          value={filters.tag}
          onChange={(e) => setFilters((p) => ({ ...p, tag: e.target.value }))}
        />
      </div>
      <div className="rounded-lg bg-white shadow">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-3">
                  <Link className="underline" href={`/expenses/${row.id}`}>
                    {row.date}
                  </Link>
                </td>
                <td>{row.merchant}</td>
                <td>{row.category}</td>
                <td>${Number(row.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link className="inline-block rounded bg-slate-900 px-4 py-2 text-white" href="/expenses/new">
        Add Expense
      </Link>
    </section>
  );
}
