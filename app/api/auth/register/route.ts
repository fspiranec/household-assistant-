import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { username: body.username, first_name: body.first_name, last_name: body.last_name } }
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data.user) {
    const admin = createAdminSupabase();
    const username = body.username || body.email?.split("@")[0] || `user_${data.user.id.slice(0, 8)}`;

    await admin.from("users").upsert({
      id: data.user.id,
      username,
      first_name: body.first_name ?? "",
      last_name: body.last_name ?? "",
      email: body.email
    });
  }

  return NextResponse.json({ message: "Registered successfully", user: data.user });
}
