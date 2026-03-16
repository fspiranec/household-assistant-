import { Suspense } from "react";
import InviteClient from "./InviteClient";

export default function InvitePage() {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Accept Household Invite</h1>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading invite...</p>}>
        <InviteClient />
      </Suspense>
    </section>
  );
}
