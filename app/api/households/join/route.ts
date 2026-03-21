import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: invite, error } = await admin
    .from("invitations")
    .select("id,household_id,status")
    .eq("token", token)
    .single();

  if (error || !invite || invite.status !== "pending") {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const { data: existingMembership, error: existingMembershipError } = await admin
    .from("household_members")
    .select("household_id")
    .eq("household_id", invite.household_id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingMembershipError) {
    return NextResponse.json({ error: existingMembershipError.message }, { status: 400 });
  }

  if (!existingMembership) {
    const { error: insertError } = await admin
      .from("household_members")
      .insert({ household_id: invite.household_id, user_id: auth.user.id, role: "member" });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }

  const { error: updateError } = await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ message: existingMembership ? "Already in household" : "Joined household" });
}
