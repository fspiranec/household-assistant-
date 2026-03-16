"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/recover", { method: "POST", body: JSON.stringify({ email }) });
    const data = await res.json();
    setMessage(data.message || (res.ok ? "Recovery email sent" : "Failed"));
  };

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Password Recovery</h1>
      <form className="space-y-3" onSubmit={submit}>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit">Send Recovery Link</Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </section>
  );
}
