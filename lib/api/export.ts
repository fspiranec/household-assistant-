import { Parser } from "json2csv";
import * as XLSX from "xlsx";

export function toCsv(rows: any[]) {
  const parser = new Parser();
  return parser.parse(rows);
}

export function toXlsxBuffer(rows: any[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
