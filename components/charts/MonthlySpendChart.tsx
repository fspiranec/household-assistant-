"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendPoint = {
  label: string;
  value: number;
};

function formatValue(value: number, valueFormat: "currency" | "number") {
  if (valueFormat === "currency") {
    return `$${value.toFixed(2)}`;
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

export function MonthlySpendChart({
  data,
  seriesLabel = "Total",
  valueFormat = "currency"
}: {
  data: TrendPoint[];
  seriesLabel?: string;
  valueFormat?: "currency" | "number";
}) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <BarChart data={data} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => formatValue(value, valueFormat)} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.16)" }}
            formatter={(value: number) => [formatValue(value, valueFormat), seriesLabel]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Bar dataKey="value" name={seriesLabel} radius={[8, 8, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill="#334155" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
