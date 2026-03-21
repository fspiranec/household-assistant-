"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlySpendChart({
  data,
  seriesLabel = "Total"
}: {
  data: { label: string; value: number }[];
  seriesLabel?: string;
}) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(value: number) => [value.toFixed(2), seriesLabel]} />
          <Area type="monotone" dataKey="value" name={seriesLabel} stroke="#0f172a" fill="#cbd5e1" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
