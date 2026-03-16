import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { supabase, user };
}
