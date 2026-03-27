"use client";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const loginHref = useMemo(() => `/login?redirect=${encodeURIComponent(redirect)}`, [redirect]);
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setMessage(data.message || data.error || (res.ok ? "Registered" : "Failed"));
    setRegistered(res.ok);
  };

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Register</h1>
      <form className="space-y-3" onSubmit={submit}>
        {Object.keys(form).map((key) => (
          <Input
            key={key}
            placeholder={key}
            type={key === "password" ? "password" : key === "email" ? "email" : "text"}
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            required
          />
        ))}
        <Button type="submit">Register</Button>
      </form>
      <div className="mt-3">
        <GoogleSignInButton className="w-full" redirectTo={redirect} />
      </div>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <a href={loginHref} className="text-blue-600 hover:underline">Log in</a>
      </p>
      {registered ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-medium">First-run checklist</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Create your first household</li>
            <li>Add your first expense</li>
            <li>Open Dashboard and apply filters</li>
          </ol>
        </div>
      ) : null}
    </section>
  );
}
