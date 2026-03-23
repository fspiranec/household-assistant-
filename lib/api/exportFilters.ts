import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpenseExportRow = {
  id: string;
  household_id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  created_by: string;
  created_by_name?: string;
  is_private: boolean;
  tags: string[] | null;
  notes: string | null;
  household_name?: string;
};

type UserRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

type HouseholdRow = {
  id: string;
  name: string;
};

function formatDisplayName(user: UserRow | undefined, fallback: string) {
  if (!user) return fallback;
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return fullName || user.username || user.email || fallback;
}

export async function getFilteredExpensesForExport(req: NextRequest, supabase: SupabaseClient) {
  const params = req.nextUrl.searchParams;
  let query = supabase.from("expenses").select("*").order("date", { ascending: false });

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
  if (error) {
    return { error };
  }

  const expenses = (data ?? []) as ExpenseExportRow[];
  const creatorIds = [...new Set(expenses.map((expense) => expense.created_by).filter(Boolean))];
  const householdIds = [...new Set(expenses.map((expense) => expense.household_id).filter(Boolean))];

  let users: UserRow[] = [];
  if (creatorIds.length > 0) {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id,username,first_name,last_name,email")
      .in("id", creatorIds);

    if (usersError) return { error: usersError };
    users = (usersData ?? []) as UserRow[];
  }

  let households: HouseholdRow[] = [];
  if (householdIds.length > 0) {
    const { data: householdData, error: householdError } = await supabase
      .from("households")
      .select("id,name")
      .in("id", householdIds);

    if (householdError) return { error: householdError };
    households = (householdData ?? []) as HouseholdRow[];
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  const householdMap = new Map(households.map((household) => [household.id, household.name]));

  return {
    data: expenses.map((expense) => ({
      ...expense,
      created_by_name: formatDisplayName(userMap.get(expense.created_by), expense.created_by),
      household_name: householdMap.get(expense.household_id) ?? expense.household_id
    }))
  };
}
