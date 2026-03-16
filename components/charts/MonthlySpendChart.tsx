"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlySpendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area dataKey="total" stroke="#0f172a" fill="#cbd5e1" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
