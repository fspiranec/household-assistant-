import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ url: data.url });
}
