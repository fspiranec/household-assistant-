import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { household_id, email } = await req.json();
  if (!household_id || typeof household_id !== "string") {
    return NextResponse.json({ error: "household_id is required" }, { status: 400 });
  }

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data: ownership, error: ownershipError } = await auth.supabase
    .from("household_members")
    .select("household_id")
    .eq("household_id", household_id)
    .eq("user_id", auth.user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (ownershipError) {
    return NextResponse.json({ error: ownershipError.message }, { status: 400 });
  }

  if (!ownership) {
    return NextResponse.json({ error: "Only household owners can add members directly" }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const { data: targetUser, error: userError } = await admin
    .from("users")
    .select("id,email,first_name,last_name,username")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  if (!targetUser) {
    return NextResponse.json({ error: "User with that email was not found. Use Invite Member to send them a join link instead." }, { status: 404 });
  }

  const { data: existingMembership, error: existingMembershipError } = await admin
    .from("household_members")
    .select("household_id")
    .eq("household_id", household_id)
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existingMembershipError) {
    return NextResponse.json({ error: existingMembershipError.message }, { status: 400 });
  }

  if (existingMembership) {
    return NextResponse.json({ message: "User is already in this household" });
  }

  const { error: insertError } = await admin
    .from("household_members")
    .insert({ household_id, user_id: targetUser.id, role: "member" });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const displayName = `${targetUser.first_name ?? ""} ${targetUser.last_name ?? ""}`.trim() || targetUser.username || targetUser.email;
  return NextResponse.json({ message: `${displayName} was added to the household` });
}
