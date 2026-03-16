import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("users")
    .select("username,first_name,last_name,email")
    .eq("id", auth.user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { error } = await auth.supabase
    .from("users")
    .update({ username: body.username, first_name: body.first_name, last_name: body.last_name, email: body.email })
    .eq("id", auth.user.id);

  if (body.password) {
    await auth.supabase.auth.updateUser({ password: body.password, email: body.email });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "Profile updated" });
}
