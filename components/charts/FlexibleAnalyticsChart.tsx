"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ChartType = "bar" | "line" | "area";

type DataPoint = {
  label: string;
  total: number;
  count: number;
  average: number;
};

type Props = {
  data: DataPoint[];
  xKey: "label";
  yKey: "total" | "count" | "average";
  chartType: ChartType;
  yAxisLabel: string;
  emptyText?: string;
};

export function FlexibleAnalyticsChart({ data, xKey, yKey, chartType, yAxisLabel, emptyText = "No data available." }: Props) {
  if (data.length === 0) {
    return <div className="flex h-80 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">{emptyText}</div>;
  }

  const sharedProps = {
    data,
    margin: { top: 8, right: 16, left: 8, bottom: 36 }
  };

  return (
    <div className="h-80">
      <ResponsiveContainer>
        {chartType === "line" ? (
          <LineChart {...sharedProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis allowDecimals={yKey !== "count"} width={80} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} name={yAxisLabel} />
          </LineChart>
        ) : chartType === "area" ? (
          <AreaChart {...sharedProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis allowDecimals={yKey !== "count"} width={80} />
            <Tooltip />
            <Area type="monotone" dataKey={yKey} stroke="#0f172a" fill="#cbd5e1" name={yAxisLabel} />
          </AreaChart>
        ) : (
          <BarChart {...sharedProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis allowDecimals={yKey !== "count"} width={80} />
            <Tooltip />
            <Bar dataKey={yKey} fill="#0f172a" radius={[4, 4, 0, 0]} name={yAxisLabel} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
