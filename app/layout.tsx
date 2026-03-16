import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Household Finance Tracker",
  description: "Track household expenses with analytics and exports"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/dashboard" className="font-semibold">Household Finance</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/expenses">Expenses</Link>
              <Link href="/households">Households</Link>
              <Link href="/export">Export</Link>
              <Link href="/profile">Profile</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
