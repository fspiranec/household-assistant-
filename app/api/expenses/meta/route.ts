import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

type UserRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const householdId = req.nextUrl.searchParams.get("household_id");
  if (!householdId) {
    return NextResponse.json({ error: "household_id is required" }, { status: 400 });
  }

  const { data: membership } = await auth.supabase
    .from("household_members")
    .select("household_id")
    .eq("household_id", householdId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [categoriesResult, tagsResult, merchantsResult, membersResult, expenseTagsResult, notesResult] = await Promise.all([
    auth.supabase.from("expense_categories").select("name").eq("household_id", householdId).order("name"),
    auth.supabase.from("tags").select("name").eq("household_id", householdId).order("name"),
    auth.supabase.from("expenses").select("merchant").eq("household_id", householdId),
    auth.supabase.from("household_members").select("user_id").eq("household_id", householdId),
    auth.supabase.from("expenses").select("tags").eq("household_id", householdId),
    auth.supabase.from("expenses").select("notes").eq("household_id", householdId).not("notes", "is", null)
  ]);

  const memberRows = (membersResult.data ?? []) as { user_id: string }[];
  const userIds = [...new Set(memberRows.map((m) => m.user_id))];

  let users: UserRow[] = [];
  if (userIds.length > 0) {
    const { data: usersData } = await auth.supabase
      .from("users")
      .select("id,username,first_name,last_name,email")
      .in("id", userIds);

    users = (usersData ?? []) as UserRow[];
  }

  const categories = [...new Set(((categoriesResult.data ?? []) as { name: string }[]).map((c) => c.name).filter(Boolean))];
  const tagsFromTable = ((tagsResult.data ?? []) as { name: string }[]).map((t) => t.name).filter(Boolean);
  const tagsFromExpenses = ((expenseTagsResult.data ?? []) as { tags: string[] | null }[])
    .flatMap((row) => row.tags ?? [])
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  const tags = [...new Set([...tagsFromTable, ...tagsFromExpenses])].sort();
  const merchants = [...new Set(((merchantsResult.data ?? []) as { merchant: string }[]).map((m) => m.merchant).filter(Boolean))].sort();
  const notes = [...new Set(((notesResult.data ?? []) as { notes: string | null }[]).map((row) => row.notes?.trim() ?? "").filter(Boolean))].sort();

  const members = userIds.map((id) => {
    const row = users.find((u) => u.id === id);
    const display = row ? `${row.first_name} ${row.last_name}`.trim() || row.username || row.email : id;
    return { id, display_name: display };
  });

  return NextResponse.json({ categories, tags, merchants, notes, members });
}
