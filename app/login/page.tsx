"use client";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const registerHref = useMemo(() => `/register?redirect=${encodeURIComponent(redirect)}`, [redirect]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    setMessage(data.message || data.error || (res.ok ? "Logged in" : "Login failed"));
    if (res.ok) {
      window.location.assign(redirect);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit">Login</Button>
      </form>
      <div className="mt-4 flex gap-4 text-sm">
        <a href={registerHref} className="text-blue-600 hover:underline">Register</a>
        <a href="/recover" className="text-blue-600 hover:underline">Forgot password?</a>
      </div>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </section>
  );
}
