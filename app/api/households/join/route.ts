import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { token } = await req.json();
  const { data: invite, error } = await auth.supabase
    .from("invitations")
    .select("id,household_id,status")
    .eq("token", token)
    .single();

  if (error || !invite || invite.status !== "pending") return NextResponse.json({ error: "Invalid invite" }, { status: 400 });

  await auth.supabase.from("household_members").insert({ household_id: invite.household_id, user_id: auth.user.id, role: "member" });
  await auth.supabase.from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id);

  return NextResponse.json({ message: "Joined household" });
}
