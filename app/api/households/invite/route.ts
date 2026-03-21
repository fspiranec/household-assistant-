import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/api/helpers";

function getPlaceholderEmail(token: string) {
  return `share-link+${token}@household.local`;
}

function getAppOrigin(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !configured.includes("localhost")) return configured.replace(/\/$/, "");

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return req.nextUrl.origin;
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

  const joinLink = `${getAppOrigin(req)}/invite?token=${token}`;

  return NextResponse.json({
    message: normalizedEmail ? "Invite created" : "Share link created",
    join_link: joinLink,
    mailto_link: normalizedEmail
      ? `mailto:${normalizedEmail}?subject=${encodeURIComponent("Join my household")}&body=${encodeURIComponent(`Use this link to join my household: ${joinLink}`)}`
      : null
  });
}
