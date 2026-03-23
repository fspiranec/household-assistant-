import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";
import { formatExpenseRows, toXlsxBuffer } from "@/lib/api/export";
import { getFilteredExpensesForExport } from "@/lib/api/exportFilters";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const result = await getFilteredExpensesForExport(req, auth.supabase);
  if ("error" in result) {
    return NextResponse.json({ error: result.error?.message ?? "Export failed" }, { status: 400 });
  }

  const buffer = toXlsxBuffer(formatExpenseRows(result.data));
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="dashboard-expenses.xlsx"'
    }
  });
}
