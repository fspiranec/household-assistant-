"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type HouseholdMember = {
  id: string;
  display_name: string;
  email: string;
  role: string;
};

type Household = {
  id: string;
  name: string;
  current_user_role: string;
  members: HouseholdMember[];
};

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
      const ownedHousehold = data.find((household) => household.current_user_role === "owner");
      setInvite((p) => ({
        ...p,
        household_id: ownedHousehold?.id ?? ""
      }));
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

  const inviteableHouseholds = households.filter((household) => household.current_user_role === "owner");

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Households</h1>
        {households.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">You are not in any households yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {households.map((household) => (
              <li key={household.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{household.name}</p>
                    <p className="text-sm text-slate-500">Your role: {household.current_user_role}</p>
                  </div>
                  {household.current_user_role === "owner" && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                      Owner view
                    </span>
                  )}
                </div>

                {household.current_user_role === "owner" && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <h2 className="text-sm font-semibold text-slate-700">Members</h2>
                    {household.members.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">No members found for this household.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {household.members.map((member) => (
                          <li key={member.id} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium text-slate-800">{member.display_name}</p>
                              <p className="text-slate-500">{member.email || member.id}</p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              {member.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
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
            {inviteableHouseholds.length === 0 && <option value="">No owned households found</option>}
            {inviteableHouseholds.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <Input placeholder="Email" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} required />
        <Button type="submit" disabled={!invite.household_id || inviteableHouseholds.length === 0}>Send Invite</Button>
      </form>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
