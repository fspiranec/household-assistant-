import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/api/helpers";

function getPlaceholderEmail(token: string) {
  return `share-link+${token}@household.local`;
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { household_id, email } = await req.json();
  if (!household_id || typeof household_id !== "string") {
    return NextResponse.json({ error: "household_id is required" }, { status: 400 });
  }

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const token = randomUUID();
  const inviteEmail = normalizedEmail || getPlaceholderEmail(token);

  const { error } = await auth.supabase
    .from("invitations")
    .insert({ household_id, email: inviteEmail, token, invited_by: auth.user.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    message: normalizedEmail ? "Invite created" : "Share link created",
    join_link: `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`
  });
}
