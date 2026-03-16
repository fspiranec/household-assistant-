import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";
import { toCsv } from "@/lib/api/export";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data, error } = await auth.supabase.from("expenses").select("*").gte("date", yearStart);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const csv = toCsv(data || []);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=expenses.csv"
    }
  });
}
