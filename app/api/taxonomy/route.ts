import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/api/helpers";

type TaxonomyAction =
  | { action: "add"; household_id: string; field: "category" | "tag"; value: string }
  | { action: "remove"; household_id: string; field: "category" | "tag"; value: string }
  | { action: "merge"; household_id: string; field: "category" | "tag"; source: string; target: string };

type ExpenseTagsRow = {
  id: string;
  tags: string[] | null;
};

async function ensureMembership(householdId: string, userId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

async function fetchTaxonomy(householdId: string, supabase: SupabaseClient) {
  const [categoriesResult, tagsResult, expenseTagsResult] = await Promise.all([
    supabase.from("expense_categories").select("name").eq("household_id", householdId).order("name"),
    supabase.from("tags").select("name").eq("household_id", householdId).order("name"),
    supabase.from("expenses").select("tags").eq("household_id", householdId)
  ]);

  if (categoriesResult.error) return { error: categoriesResult.error.message };
  if (tagsResult.error) return { error: tagsResult.error.message };
  if (expenseTagsResult.error) return { error: expenseTagsResult.error.message };

  const categories = [...new Set((categoriesResult.data ?? []).map((row) => row.name).filter(Boolean))].sort();
  const tagsFromTable = (tagsResult.data ?? []).map((row) => row.name).filter(Boolean);
  const tagsFromExpenses = (expenseTagsResult.data ?? [])
    .flatMap((row) => row.tags ?? [])
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  const tags = [...new Set([...tagsFromTable, ...tagsFromExpenses])].sort();

  return { categories, tags };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const householdId = req.nextUrl.searchParams.get("household_id");
  if (!householdId) return NextResponse.json({ error: "household_id is required" }, { status: 400 });

  const isMember = await ensureMembership(householdId, auth.user.id, auth.supabase);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const taxonomy = await fetchTaxonomy(householdId, auth.supabase);
  if ("error" in taxonomy) return NextResponse.json({ error: taxonomy.error }, { status: 400 });
  return NextResponse.json(taxonomy);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json() as TaxonomyAction;
  if (!body.household_id) return NextResponse.json({ error: "household_id is required" }, { status: 400 });

  const isMember = await ensureMembership(body.household_id, auth.user.id, auth.supabase);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const normalize = (value: string) => value.trim();

  if (body.action === "add") {
    const value = normalize(body.value);
    if (!value) return NextResponse.json({ error: "Value is required" }, { status: 400 });

    if (body.field === "category") {
      const { error } = await auth.supabase
        .from("expense_categories")
        .upsert({ household_id: body.household_id, name: value }, { onConflict: "household_id,name" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await auth.supabase
        .from("tags")
        .upsert({ household_id: body.household_id, name: value, created_by: auth.user.id }, { onConflict: "household_id,name" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (body.action === "remove") {
    const value = normalize(body.value);
    if (!value) return NextResponse.json({ error: "Value is required" }, { status: 400 });

    if (body.field === "category") {
      const { error: updateError } = await auth.supabase
        .from("expenses")
        .update({ category: "Uncategorized" })
        .eq("household_id", body.household_id)
        .eq("category", value);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

      const { error: deleteError } = await auth.supabase
        .from("expense_categories")
        .delete()
        .eq("household_id", body.household_id)
        .eq("name", value);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
    } else {
      const { data: expenseRows, error: expenseError } = await auth.supabase
        .from("expenses")
        .select("id,tags")
        .eq("household_id", body.household_id);
      if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 400 });

      for (const row of (expenseRows ?? []) as ExpenseTagsRow[]) {
        const current = (row.tags ?? []).map((tag: string) => String(tag));
        if (!current.some((tag) => tag.toLowerCase() === value.toLowerCase())) continue;
        const updated = current.filter((tag) => tag.toLowerCase() !== value.toLowerCase());
        const { error } = await auth.supabase.from("expenses").update({ tags: updated }).eq("id", row.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { error: deleteError } = await auth.supabase
        .from("tags")
        .delete()
        .eq("household_id", body.household_id)
        .eq("name", value);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  if (body.action === "merge") {
    const source = normalize(body.source);
    const target = normalize(body.target);
    if (!source || !target) return NextResponse.json({ error: "source and target are required" }, { status: 400 });
    if (source === target) return NextResponse.json({ error: "source and target must be different" }, { status: 400 });

    if (body.field === "category") {
      const { error: upsertError } = await auth.supabase
        .from("expense_categories")
        .upsert({ household_id: body.household_id, name: target }, { onConflict: "household_id,name" });
      if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

      const { error: updateError } = await auth.supabase
        .from("expenses")
        .update({ category: target })
        .eq("household_id", body.household_id)
        .eq("category", source);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

      const { error: deleteError } = await auth.supabase
        .from("expense_categories")
        .delete()
        .eq("household_id", body.household_id)
        .eq("name", source);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
    } else {
      const { error: upsertError } = await auth.supabase
        .from("tags")
        .upsert({ household_id: body.household_id, name: target, created_by: auth.user.id }, { onConflict: "household_id,name" });
      if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

      const { data: expenseRows, error: expenseError } = await auth.supabase
        .from("expenses")
        .select("id,tags")
        .eq("household_id", body.household_id);
      if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 400 });

      for (const row of (expenseRows ?? []) as ExpenseTagsRow[]) {
        const current = (row.tags ?? []).map((tag: string) => String(tag));
        if (!current.some((tag) => tag.toLowerCase() === source.toLowerCase())) continue;
        const replaced = current.map((tag) => (tag.toLowerCase() === source.toLowerCase() ? target : tag));
        const deduped = [...new Set(replaced)];
        const { error } = await auth.supabase.from("expenses").update({ tags: deduped }).eq("id", row.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { error: deleteError } = await auth.supabase
        .from("tags")
        .delete()
        .eq("household_id", body.household_id)
        .eq("name", source);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
  }

  const taxonomy = await fetchTaxonomy(body.household_id, auth.supabase);
  if ("error" in taxonomy) return NextResponse.json({ error: taxonomy.error }, { status: 400 });

  return NextResponse.json({ message: "Taxonomy updated", ...taxonomy });
}
