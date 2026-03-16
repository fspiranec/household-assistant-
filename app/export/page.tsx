import Link from "next/link";

export default function ExportPage() {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Export & Reports</h1>
      <div className="flex gap-3">
        <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/api/export/csv">Download CSV</Link>
        <Link className="rounded bg-slate-900 px-4 py-2 text-white" href="/api/export/xlsx">Download XLSX</Link>
      </div>
      <p className="mt-4 text-sm text-slate-600">Use dashboard for yearly and monthly analytics summaries.</p>
    </section>
  );
}
