"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const colors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

export function SpendByCategoryChart({ data }: { data: { category: string; total: number }[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="category" outerRadius={120}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
