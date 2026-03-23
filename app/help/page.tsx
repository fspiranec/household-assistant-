import Link from "next/link";

const quickStart = [
  "Create your account on the Register page.",
  "Log in with your email and password.",
  "Create a household on the Households page.",
  "Invite other members if you want to track spending together.",
  "Go to Expenses and select Add Expense.",
  "Enter the amount, date, merchant, category, and any notes or tags.",
  "Optional: upload a receipt to auto-fill some fields.",
  "Open the Dashboard to review totals, charts, and trends.",
  "Use Export when you need a downloadable file for the current year."
];

const features = [
  "Create an account, log in, and recover your password.",
  "Create or join households and invite other people.",
  "Add, view, edit, and delete expenses you created.",
  "Mark expenses as private when needed.",
  "Use categories, tags, merchants, and notes to organize records.",
  "Upload a receipt to help fill in merchant, total, and date.",
  "Review spending with dashboard filters, charts, and summaries.",
  "Download CSV or XLSX exports."
];

const faq = [
  {
    question: "Do I need a household before adding expenses?",
    answer: "Yes. Every expense belongs to a household, so you need to create or join one first."
  },
  {
    question: "Can anyone edit an expense?",
    answer: "No. Only the person who created an expense can edit or delete it."
  },
  {
    question: "What is the difference between household and private expenses?",
    answer: "Household expenses are shared records. Private expenses are stored separately and can be included or excluded depending on your filters."
  },
  {
    question: "Can I invite someone who does not have an account yet?",
    answer: "Yes. Create an invite link and have them log in or register from that link."
  },
  {
    question: "What if receipt details are wrong?",
    answer: "Review and correct the amount, date, merchant, category, tags, or notes before saving."
  },
  {
    question: "What can I export?",
    answer: "The current Export page downloads CSV or XLSX files for the current year."
  }
];

const pageHelp = [
  {
    title: "Dashboard",
    text: "Use filters to narrow results by household, date, user, category, tag, merchant, and privacy. Then select Apply filters to update totals and charts."
  },
  {
    title: "Expenses",
    text: "Use this page to browse saved expenses, filter them, and open an expense by selecting its date."
  },
  {
    title: "Add Expense",
    text: "Choose the household first, then enter the required fields. You can also upload a receipt to help fill in details."
  },
  {
    title: "Households",
    text: "Create a household, invite members, generate share links, or add an existing user directly if they already have an account."
  },
  {
    title: "Export",
    text: "Download a CSV or XLSX copy of the current year’s expenses."
  },
  {
    title: "Profile",
    text: "Update your username, name, email, and password from the Profile page."
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-3xl font-semibold text-slate-900">Help Center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Household Finance Tracker helps households, couples, families, and roommates track shared spending in one place.
          You can create or join households, add expenses, organize them with categories and tags, review trends on the dashboard,
          and download reports when you need a spreadsheet copy.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/register">Get started</Link>
          <Link className="rounded border border-slate-300 px-4 py-2 text-slate-900" href="/dashboard">Open dashboard</Link>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Quick start</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {quickStart.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">What the app does</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Common workflows</h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
            <div>
              <h3 className="font-medium text-slate-900">Create a household</h3>
              <p>Open Households, enter a household name in Create Household, and select Create.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Invite someone</h3>
              <p>Open Households, choose a household in Invite Member, enter the person’s email, and create the invite link.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Add an expense</h3>
              <p>Go to Expenses, select Add Expense, choose the household, complete the form, and save.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Edit an expense</h3>
              <p>Open an expense from the Expenses list. If you created it, update the form and save your changes.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Review spending</h3>
              <p>Use Dashboard filters, select Apply filters, and review totals, charts, and the by-user summary.</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Page-by-page help</h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
            {pageHelp.map((item) => (
              <div key={item.title}>
                <h3 className="font-medium text-slate-900">{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Tips</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          <li>Create or join a household before trying to add expenses.</li>
          <li>Review receipt-filled fields before saving, especially the amount and date.</li>
          <li>Use consistent categories and tags to keep reports easier to read.</li>
          <li>Remember to select <span className="font-medium">Apply filters</span> after changing dashboard filters.</li>
          <li>If a person already has an account, owners can add them directly by email from Households.</li>
        </ul>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          {faq.map((item) => (
            <div key={item.question}>
              <h3 className="font-medium text-slate-900">{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900 shadow-sm">
        <h2 className="text-xl font-semibold">Needs confirmation</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Google sign-in exists in the backend, but there is no visible Google sign-in option in the current UI.</li>
          <li>The UI does not currently explain receipt file limits or supported file types.</li>
          <li>The Export page appears to download the current year only.</li>
        </ul>
      </section>
    </div>
  );
}
