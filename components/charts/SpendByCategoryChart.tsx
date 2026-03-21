"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const colors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#475569", "#1e293b"];

export function SpendByCategoryChart({ data }: { data: { label: string; total: number; name?: string }[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" outerRadius={120}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
