import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

type ExpenseUpdateBody = {
  household_id?: string;
  amount?: string;
  date?: string;
  merchant?: string;
  category?: string;
  tags?: unknown[];
  notes?: string;
  is_private?: boolean;
};

function normalizeTags(tags: unknown) {
  const rawTags = Array.isArray(tags) ? tags : [];
  return [...new Set(rawTags.map((tag) => String(tag).trim()).filter(Boolean))];
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { data, error } = await auth.supabase.from("expenses").select("*, expense_items(*), expense_files(*)").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json() as ExpenseUpdateBody;

  const tags = normalizeTags(body.tags);
  const updatePayload = {
    household_id: body.household_id,
    amount: body.amount,
    date: body.date,
    merchant: body.merchant,
    category: body.category,
    notes: body.notes,
    tags,
    is_private: body.is_private
  };

  const { data, error } = await auth.supabase.from("expenses").update(updatePayload).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data.category) {
    const { error: categoryError } = await auth.supabase
      .from("expense_categories")
      .upsert({ household_id: data.household_id, name: data.category }, { onConflict: "household_id,name" });
    if (categoryError) return NextResponse.json({ error: categoryError.message }, { status: 400 });
  }

  if (tags.length > 0) {
    const { error: tagError } = await auth.supabase.from("tags").upsert(
      tags.map((name) => ({ household_id: data.household_id, name, created_by: auth.user.id })),
      { onConflict: "household_id,name" }
    );
    if (tagError) return NextResponse.json({ error: tagError.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { error } = await auth.supabase.from("expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "Deleted" });
}
