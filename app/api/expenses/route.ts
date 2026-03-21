import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/api/helpers";

type ExpenseWriteBody = {
  household_id: string;
  amount: string;
  date: string;
  merchant: string;
  category: string;
  tags?: unknown[];
  notes?: string;
  parsed_payload?: unknown;
  is_private?: boolean;
};

type ExpenseRow = {
  id: string;
  household_id: string;
  created_by: string;
  amount: number;
  date: string;
  merchant: string;
  category: string;
  tags: string[] | null;
  notes: string | null;
  parsed_payload: Record<string, unknown> | null;
  is_private: boolean;
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

async function upsertMetadata(
  supabase: SupabaseClient,
  householdId: string,
  category: string,
  tags: string[],
  userId: string
) {
  const categoryName = category.trim();
  if (categoryName) {
    const { error: categoryError } = await supabase
      .from("expense_categories")
      .upsert({ household_id: householdId, name: categoryName }, { onConflict: "household_id,name" });
    if (categoryError) return categoryError;
  }

  if (tags.length > 0) {
    const { error: tagError } = await supabase.from("tags").upsert(
      tags.map((name) => ({ household_id: householdId, name, created_by: userId })),
      { onConflict: "household_id,name" }
    );
    if (tagError) return tagError;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const params = req.nextUrl.searchParams;
  let query = auth.supabase.from("expenses").select("*").order("date", { ascending: false });

  const householdId = params.get("household_id");
  const createdBy = params.getAll("created_by").filter(Boolean);
  const merchants = params.getAll("merchant").filter(Boolean);
  const categories = params.getAll("category").filter(Boolean);
  const tags = params.getAll("tag").filter(Boolean);
  const start = params.get("start");
  const end = params.get("end");
  const excludePrivate = params.get("exclude_private") === "true";

  if (householdId) query = query.eq("household_id", householdId);
  if (createdBy.length > 0) query = query.in("created_by", createdBy);
  if (merchants.length > 0) query = query.in("merchant", merchants);
  if (start) query = query.gte("date", start);
  if (end) query = query.lte("date", end);
  if (categories.length > 0) query = query.in("category", categories);
  if (tags.length > 0) query = query.overlaps("tags", tags);
  if (excludePrivate) query = query.eq("is_private", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const expenses = (data ?? []) as ExpenseRow[];
  const creatorIds = [...new Set(expenses.map((expense) => expense.created_by))];

  let users: UserRow[] = [];
  if (creatorIds.length > 0) {
    const { data: usersData, error: usersError } = await auth.supabase
      .from("users")
      .select("id,username,first_name,last_name,email")
      .in("id", creatorIds);

    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 });
    users = (usersData ?? []) as UserRow[];
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  return NextResponse.json({
    data: expenses.map((expense) => ({
      ...expense,
      created_by_name: formatDisplayName(userMap.get(expense.created_by), expense.created_by)
    }))
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json() as ExpenseWriteBody;
  const normalizedTags = normalizeTags(body.tags);

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
      parsed_payload: body.parsed_payload ?? null,
      is_private: body.is_private ?? false
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const metadataError = await upsertMetadata(auth.supabase, body.household_id, body.category, normalizedTags, auth.user.id);
  if (metadataError) return NextResponse.json({ error: metadataError.message }, { status: 400 });

  return NextResponse.json({ ...data, created_by_name: auth.user.email ?? auth.user.id }, { status: 201 });
}
