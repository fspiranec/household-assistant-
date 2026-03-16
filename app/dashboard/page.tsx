"use client";
import { useEffect, useState } from "react";
import { MonthlySpendChart } from "@/components/charts/MonthlySpendChart";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/expenses").then(async (res) => {
      if (res.ok) setExpenses((await res.json()).data);
    });
  }, []);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = Object.entries(expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {})).map(([category, total]) => ({ category, total }));

  const byMonth = Object.entries(expenses.reduce((acc: Record<string, number>, e) => {
    const m = new Date(e.date).toLocaleDateString(undefined, { month: "short" });
    acc[m] = (acc[m] || 0) + Number(e.amount);
    return acc;
  }, {})).map(([month, total]) => ({ month, total }));

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <p className="mt-2 text-lg">Total spent this year: ${total.toFixed(2)}</p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow"><h2 className="mb-2 font-semibold">Spend by Category</h2><SpendByCategoryChart data={byCategory} /></div>
        <div className="rounded-lg bg-white p-6 shadow"><h2 className="mb-2 font-semibold">Monthly Trend</h2><MonthlySpendChart data={byMonth} /></div>
      </section>
    </div>
  );
}
