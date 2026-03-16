"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Household = { id: string; name: string };

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [name, setName] = useState("");
  const [invite, setInvite] = useState({ household_id: "", email: "" });
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await fetch("/api/households");
    if (res.ok) {
      const data = (await res.json()) as Household[];
      setHouseholds(data);
      if (data.length > 0) {
        setInvite((p) => ({ ...p, household_id: p.household_id || data[0].id }));
      }
      return;
    }

    const data = await res.json().catch(() => ({}));
    setMessage(data.error || "Failed to load households");
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to create household");
      return;
    }

    setMessage("Household created successfully");
    setName("");
    load();
  };

  const sendInvite = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/households/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invite)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to send invite");
      return;
    }

    setMessage("Invite sent");
    setInvite((p) => ({ ...p, email: "" }));
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
        <label className="block text-sm">
          Household
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={invite.household_id}
            onChange={(e) => setInvite((p) => ({ ...p, household_id: e.target.value }))}
            required
          >
            {households.length === 0 && <option value="">No households found</option>}
            {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <Input placeholder="Email" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} required />
        <Button type="submit" disabled={!invite.household_id}>Send Invite</Button>
      </form>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
