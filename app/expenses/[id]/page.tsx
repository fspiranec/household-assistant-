"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<any>();

  useEffect(() => {
    fetch(`/api/expenses/${id}`).then(async (res) => {
      if (res.ok) setExpense(await res.json());
    });
  }, [id]);

  if (!expense) return <p>Loading...</p>;

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Expense Detail</h1>
      <pre className="mt-4 overflow-auto rounded bg-slate-100 p-4 text-sm">{JSON.stringify(expense, null, 2)}</pre>
    </section>
  );
}
