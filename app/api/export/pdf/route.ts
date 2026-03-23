import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";
import { escapeHtml, formatExpenseRows } from "@/lib/api/export";
import { getFilteredExpensesForExport } from "@/lib/api/exportFilters";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const result = await getFilteredExpensesForExport(req, auth.supabase);
  if ("error" in result) {
    return NextResponse.json({ error: result.error?.message ?? "Export failed" }, { status: 400 });
  }

  const rows = formatExpenseRows(result.data);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const householdName = rows[0]?.household ?? "Selected household";
  const generatedAt = new Date().toISOString();

  const tableRows = rows.length > 0
    ? rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.merchant)}</td>
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.created_by)}</td>
        <td>${escapeHtml(row.privacy)}</td>
        <td>${escapeHtml(row.tags)}</td>
        <td>${escapeHtml(row.notes)}</td>
        <td class="amount">$${row.amount.toFixed(2)}</td>
      </tr>`).join("")
    : '<tr><td colspan="8" class="empty">No expenses match the applied dashboard filters.</td></tr>';

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Dashboard Expenses PDF</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
      h1 { margin-bottom: 4px; }
      p { margin: 4px 0; }
      .summary { margin: 16px 0 20px; display: flex; gap: 24px; flex-wrap: wrap; }
      .summary strong { display: block; font-size: 12px; color: #475569; text-transform: uppercase; }
      .summary span { font-size: 18px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; text-align: left; }
      th { background: #f8fafc; }
      .amount { text-align: right; white-space: nowrap; }
      .empty { text-align: center; color: #64748b; padding: 24px; }
      @media print {
        body { margin: 12px; }
        button { display: none; }
      }
    </style>
  </head>
  <body>
    <button onclick="window.print()">Print / Save as PDF</button>
    <h1>Dashboard expense export</h1>
    <p>Readable export of the expenses currently shown on the dashboard.</p>
    <div class="summary">
      <div><strong>Household</strong><span>${escapeHtml(householdName)}</span></div>
      <div><strong>Expenses</strong><span>${rows.length}</span></div>
      <div><strong>Total</strong><span>$${total.toFixed(2)}</span></div>
      <div><strong>Generated</strong><span>${escapeHtml(generatedAt)}</span></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Merchant</th>
          <th>Category</th>
          <th>Created by</th>
          <th>Privacy</th>
          <th>Tags</th>
          <th>Notes</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <script>window.addEventListener("load", () => { window.print(); });</script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'inline; filename="dashboard-expenses.pdf.html"'
    }
  });
}
