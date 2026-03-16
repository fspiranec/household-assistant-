import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = new URL("/login", requestUrl.origin);

  const response = NextResponse.redirect(redirectTo);

  if (!code) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorUrl = new URL("/login", requestUrl.origin);
    errorUrl.searchParams.set("error", "Email confirmation failed. Please try logging in again.");
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin), {
    headers: response.headers
  });
}
