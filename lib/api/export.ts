import { Parser } from "json2csv";
import * as XLSX from "xlsx";

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

export type ExportExpenseRow = {
  date: string;
  household: string;
  merchant: string;
  category: string;
  amount: number;
  created_by: string;
  privacy: string;
  tags: string;
  notes: string;
};

export function toCsv(rows: ExportRow[]) {
  const parser = new Parser<ExportRow>();
  return parser.parse(rows);
}

export function toXlsxBuffer(rows: ExportRow[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function formatExpenseRows(
  rows: Array<{
    date: string;
    household_name?: string | null;
    merchant?: string | null;
    category?: string | null;
    amount: number | string;
    created_by_name?: string | null;
    created_by?: string | null;
    is_private?: boolean | null;
    tags?: string[] | null;
    notes?: string | null;
  }>
): ExportExpenseRow[] {
  return rows.map((row) => ({
    date: row.date,
    household: row.household_name?.trim() || "Unknown household",
    merchant: row.merchant?.trim() || "Unknown merchant",
    category: row.category?.trim() || "Uncategorized",
    amount: Number(row.amount),
    created_by: row.created_by_name?.trim() || row.created_by?.trim() || "Unknown user",
    privacy: row.is_private ? "Private" : "Household",
    tags: row.tags && row.tags.length > 0 ? row.tags.join(", ") : "No tags",
    notes: row.notes?.trim() || "No notes"
  }));
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
