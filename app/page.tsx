import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const onboardingSteps = [
  "Create your household",
  "Add your first expense",
  "Review your dashboard insights"
];

export default function Home() {
  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-8 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Household Finance Tracker</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Shared expense tracking without spreadsheet chaos.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Keep household and private spending in one place, invite members, parse receipts, and export reports from one dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" href="/register">
            Register
          </Link>
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/login">
            Login
          </Link>
        </div>
        <div className="mt-3 max-w-xs">
          <GoogleSignInButton className="w-full" />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8">
        <h2 className="text-xl font-semibold text-slate-900">First-run checklist</h2>
        <p className="mt-2 text-sm text-slate-600">Most households are fully set up in under 5 minutes.</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {onboardingSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Link className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline" href="/help">
          Read the full help guide
        </Link>
      </div>
    </section>
  );
}
