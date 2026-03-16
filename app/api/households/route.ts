import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";
import { Household } from "@/types";

type HouseholdMemberJoinRow = {
  households: Household[] | null;
};

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("household_members")
    .select("households(id,name)")
    .eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []) as HouseholdMemberJoinRow[];
  const households = rows.flatMap((r) => r.households ?? []);
  return NextResponse.json(households);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { name } = await req.json();
  const { data: household, error } = await auth.supabase
    .from("households")
    .insert({ name, created_by: auth.user.id })
    .select("id,name")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: memberError } = await auth.supabase
    .from("household_members")
    .insert({ household_id: household.id, user_id: auth.user.id, role: "owner" });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json(household, { status: 201 });
}
