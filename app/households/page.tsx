"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Household = { id: string; name: string };

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [name, setName] = useState("");
  const [invite, setInvite] = useState({ household_id: "", email: "" });

  const load = async () => {
    const res = await fetch("/api/households");
    if (res.ok) setHouseholds(await res.json());
  };

  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/households", { method: "POST", body: JSON.stringify({ name }) });
    setName("");
    load();
  };

  const sendInvite = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/households/invite", { method: "POST", body: JSON.stringify(invite) });
    setInvite({ household_id: "", email: "" });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Household Selector</h1>
        <ul className="mt-4 space-y-2">{households.map((h) => <li key={h.id}>{h.name}</li>)}</ul>
      </section>
      <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={create}>
        <h2 className="font-semibold">Create Household</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Household name" required />
        <Button type="submit">Create</Button>
      </form>
      <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={sendInvite}>
        <h2 className="font-semibold">Invite Member</h2>
        <Input placeholder="Household ID" value={invite.household_id} onChange={(e) => setInvite((p) => ({ ...p, household_id: e.target.value }))} required />
        <Input placeholder="Email" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} required />
        <Button type="submit">Send Invite</Button>
      </form>
    </div>
  );
}
