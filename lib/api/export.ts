import { Parser } from "json2csv";
import * as XLSX from "xlsx";

type ExportRow = Record<string, string | number | boolean | null | undefined>;

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
