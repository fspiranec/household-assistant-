import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { household_id, email } = await req.json();
  const token = randomUUID();
  const { error } = await auth.supabase.from("invitations").insert({ household_id, email, token, invited_by: auth.user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: "Invite created", join_link: `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}` });
}
