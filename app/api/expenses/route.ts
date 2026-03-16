import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const params = req.nextUrl.searchParams;
  let query = auth.supabase.from("expenses").select("*").order("date", { ascending: false });

  const householdId = params.get("household_id");
  const createdBy = params.get("created_by");
  const merchants = params.getAll("merchant").filter(Boolean);
  const categories = params.getAll("category").filter(Boolean);
  const tags = params.getAll("tag").filter(Boolean);
  const start = params.get("start");
  const end = params.get("end");

  if (householdId) query = query.eq("household_id", householdId);
  if (createdBy) query = query.eq("created_by", createdBy);
  if (merchants.length > 0) query = query.in("merchant", merchants);
  if (start) query = query.gte("date", start);
  if (end) query = query.lte("date", end);
  if (categories.length > 0) query = query.in("category", categories);
  if (tags.length > 0) query = query.overlaps("tags", tags);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { household_id: string; amount: string; date: string; merchant: string; category: string; tags?: unknown[]; notes?: string; parsed_payload?: unknown };
  const rawTags = Array.isArray(body.tags) ? body.tags : [];
  const normalizedTags = [...new Set(rawTags.map((t) => String(t).trim()).filter(Boolean))];

  const { data, error } = await auth.supabase
    .from("expenses")
    .insert({
      household_id: body.household_id,
      created_by: auth.user.id,
      amount: body.amount,
      date: body.date,
      merchant: body.merchant,
      category: body.category,
      tags: normalizedTags,
      notes: body.notes,
      parsed_payload: body.parsed_payload ?? null
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auth.supabase.from("expense_categories").upsert({ household_id: body.household_id, name: body.category }, { onConflict: "household_id,name" });
  if (normalizedTags.length > 0) {
    await auth.supabase.from("tags").upsert(
      normalizedTags.map((name) => ({ household_id: body.household_id, name, created_by: auth.user.id })),
      { onConflict: "household_id,name" }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
