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

type UserRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

function normalizeTags(tags: unknown) {
  const rawTags = Array.isArray(tags) ? tags : [];
  return [...new Set(rawTags.map((tag) => String(tag).trim()).filter(Boolean))];
}

function formatDisplayName(user: UserRow | undefined, fallback: string) {
  if (!user) return fallback;
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return fullName || user.username || user.email || fallback;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("expenses")
    .select("*, expense_items(*), expense_files(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  const { data: creator } = await auth.supabase
    .from("users")
    .select("id,username,first_name,last_name,email")
    .eq("id", data.created_by)
    .maybeSingle();

  return NextResponse.json({
    ...data,
    created_by_name: formatDisplayName((creator ?? undefined) as UserRow | undefined, data.created_by),
    can_edit: data.created_by === auth.user.id
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json() as ExpenseUpdateBody;

  const { data: existingExpense, error: existingExpenseError } = await auth.supabase
    .from("expenses")
    .select("id,created_by,household_id")
    .eq("id", id)
    .single();

  if (existingExpenseError || !existingExpense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  if (existingExpense.created_by !== auth.user.id) {
    return NextResponse.json({ error: "Only the expense creator can edit this expense" }, { status: 403 });
  }

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

  return NextResponse.json({ ...data, can_edit: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const { data: existingExpense, error: existingExpenseError } = await auth.supabase
    .from("expenses")
    .select("id,created_by")
    .eq("id", id)
    .single();

  if (existingExpenseError || !existingExpense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  if (existingExpense.created_by !== auth.user.id) {
    return NextResponse.json({ error: "Only the expense creator can delete this expense" }, { status: 403 });
  }

  const { error } = await auth.supabase.from("expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "Deleted" });
}
