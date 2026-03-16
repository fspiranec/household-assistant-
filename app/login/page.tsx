"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    const data = await res.json();
    setMessage(data.message || (res.ok ? "Logged in" : "Login failed"));
    if (res.ok) router.push("/dashboard");
  };

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit">Login</Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </section>
  );
}
