import "./globals.css";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = {
  title: "Household Finance Tracker",
  description: "Track household expenses with analytics and exports"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);

  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="font-semibold">Household Finance</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
              {isLoggedIn && (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/expenses">Expenses</Link>
                  <Link href="/households">Households</Link>
                  <Link href="/export">Export</Link>
                  <Link href="/profile">Profile</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
