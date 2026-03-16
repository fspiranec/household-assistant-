import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";
import { toXlsxBuffer } from "@/lib/api/export";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data, error } = await auth.supabase.from("expenses").select("*").gte("date", yearStart);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const buffer = toXlsxBuffer(data || []);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=expenses.xlsx"
    }
  });
}
