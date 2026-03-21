"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type HouseholdMember = {
  id: string;
  role: string;
  display_name: string;
  email: string;
};

type Household = {
  id: string;
  name: string;
  current_user_role: string | null;
  members: HouseholdMember[];
};

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [name, setName] = useState("");
  const [invite, setInvite] = useState({ household_id: "", email: "" });
  const [directAdd, setDirectAdd] = useState({ household_id: "", email: "" });
  const [message, setMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [mailtoLink, setMailtoLink] = useState("");

  const load = async () => {
    const res = await fetch("/api/households");
    if (res.ok) {
      const data = (await res.json()) as Household[];
      setHouseholds(data);
      if (data.length > 0) {
        setInvite((p) => ({ ...p, household_id: p.household_id || data[0].id }));
        setDirectAdd((p) => ({ ...p, household_id: p.household_id || data[0].id }));
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
      setMessage(data.error || "Failed to create invite");
      return;
    }

    setMessage(data.message || "Invite created");
    setShareLink(data.join_link || "");
    setMailtoLink(data.mailto_link || "");
    setInvite((p) => ({ ...p, email: "" }));
  };

  const addUserDirectly = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/households/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(directAdd)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to add user to household");
      return;
    }

    setMessage(data.message || "User added to household");
    setDirectAdd((p) => ({ ...p, email: "" }));
    load();
  };

  const generateShareLink = async (household_id: string) => {
    const res = await fetch("/api/households/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ household_id })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to generate share link");
      return;
    }

    setShareLink(data.join_link || "");
    setMailtoLink("");
    setMessage(data.message || "Share link created");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Households</h1>
            <p className="mt-1 text-sm text-slate-600">Owners can now see who belongs to each household directly from this tab.</p>
          </div>
        </div>

        {households.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">You are not in a household yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {households.map((household) => {
              const isOwner = household.current_user_role === "owner";

              return (
                <article key={household.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{household.name}</h2>
                      <p className="text-sm text-slate-600">
                        Your role: <span className="font-medium capitalize">{household.current_user_role ?? "member"}</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {isOwner ? `${household.members.length} member${household.members.length === 1 ? "" : "s"}` : "Members visible to owner"}
                    </span>
                  </div>

                  {isOwner ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button type="button" onClick={() => generateShareLink(household.id)}>Generate Share Link</Button>
                    </div>
                  ) : null}

                  {isOwner ? (
                    household.members.length > 0 ? (
                      <ul className="mt-4 space-y-3">
                        {household.members.map((member) => (
                          <li key={member.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                            <div>
                              <p className="font-medium text-slate-900">{member.display_name}</p>
                              <p className="text-sm text-slate-600">{member.email || "No email available"}</p>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700 shadow-sm ring-1 ring-slate-200">
                              {member.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-slate-600">No members found in this household yet.</p>
                    )
                  ) : (
                    <p className="mt-4 text-sm text-slate-600">Only the household owner can see the full member list here.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={create}>
        <h2 className="font-semibold">Create Household</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Household name" required />
        <Button type="submit">Create</Button>
      </form>
      <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={addUserDirectly}>
        <h2 className="font-semibold">Add User to Household</h2>
        <p className="text-sm text-slate-600">Use this when the person already has an account and you want to add them directly by email.</p>
        <label className="block text-sm">
          Household
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={directAdd.household_id}
            onChange={(e) => setDirectAdd((p) => ({ ...p, household_id: e.target.value }))}
            required
          >
            {households.length === 0 && <option value="">No households found</option>}
            {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <Input placeholder="Existing user email" type="email" value={directAdd.email} onChange={(e) => setDirectAdd((p) => ({ ...p, email: e.target.value }))} required />
        <Button type="submit" disabled={!directAdd.household_id}>Add User</Button>
      </form>
      <form className="rounded-lg bg-white p-6 shadow space-y-3" onSubmit={sendInvite}>
        <h2 className="font-semibold">Invite Member</h2>
        <p className="text-sm text-slate-600">Create an invite link for someone who is not in the household yet. You can then share the link or open an email draft with it.</p>
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
        <Input placeholder="Invitee email" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} required />
        <Button type="submit" disabled={!invite.household_id}>Create Invite Link</Button>
      </form>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      {shareLink && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Invite link</p>
          <p className="mt-2 break-all">{shareLink}</p>
          {mailtoLink && (
            <p className="mt-3">
              <a href={mailtoLink} className="text-blue-600 hover:underline">Open email draft with invite link</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
