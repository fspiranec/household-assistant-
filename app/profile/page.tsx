"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/user/profile").then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setForm((p) => ({ ...p, ...data }));
    });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/user/profile", { method: "PUT", body: JSON.stringify(form) });
    const data = await res.json();
    setMessage(data.message || (res.ok ? "Profile updated" : "Update failed"));
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Profile</h1>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        {Object.keys(form).map((key) => (
          <Input
            key={key}
            placeholder={key}
            type={key === "password" ? "password" : key === "email" ? "email" : "text"}
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          />
        ))}
        <Button type="submit" className="md:col-span-2 w-fit">Save</Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </section>
  );
}
