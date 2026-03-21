"use client";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const loginHref = useMemo(() => `/login?redirect=${encodeURIComponent(redirect)}`, [redirect]);
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setMessage(data.message || data.error || (res.ok ? "Registered" : "Failed"));
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
      <p className="mt-4 text-sm text-slate-600">{message}</p>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <a href={loginHref} className="text-blue-600 hover:underline">Log in</a>
      </p>
    </section>
  );
}
