import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("household_members")
    .select("households(id,name)")
    .eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data.map((r: any) => r.households));
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

  await auth.supabase.from("household_members").insert({ household_id: household.id, user_id: auth.user.id, role: "owner" });

  return NextResponse.json(household, { status: 201 });
}
