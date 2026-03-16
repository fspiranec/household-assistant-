"use client";
import { useEffect, useMemo, useState } from "react";
import { MonthlySpendChart } from "@/components/charts/MonthlySpendChart";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";
import { Expense, ExpensesResponse, Household } from "@/types";

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState("");

  useEffect(() => {
    fetch("/api/households").then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as Household[];
      setHouseholds(data);
      if (data.length > 0) setHouseholdId(data[0].id);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (householdId) params.set("household_id", householdId);

    fetch(`/api/expenses?${params.toString()}`).then(async (res) => {
      if (!res.ok) return;
      const payload = (await res.json()) as ExpensesResponse;
      setExpenses(payload.data ?? []);
    });
  }, [householdId]);

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
    ).map(([userId, userStats]) => ({ userId, ...userStats })).sort((a, b) => b.total - a.total),
    [expenses]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow space-y-3">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <label className="block text-sm">
          Household
          <select
            className="mt-1 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={householdId}
            onChange={(e) => setHouseholdId(e.target.value)}
          >
            {households.length === 0 && <option value="">No households found</option>}
            {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <p className="text-lg">Total spent: ${total.toFixed(2)}</p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 font-semibold">Spend by Category</h2>
          <SpendByCategoryChart data={byCategory} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 font-semibold">Monthly Trend</h2>
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
                <td className="p-2">{row.userId}</td>
                <td className="p-2 text-right">{row.count}</td>
                <td className="p-2 text-right">${row.total.toFixed(2)}</td>
              </tr>
            ))}
            {byPerson.length === 0 && (
              <tr>
                <td className="p-2 text-slate-500" colSpan={3}>No expenses in this household yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
