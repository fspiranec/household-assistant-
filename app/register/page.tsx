"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    setMessage(data.message || (res.ok ? "Registered" : "Failed"));
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
    </section>
  );
}
