"use client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function InvitePage() {
  const params = useSearchParams();
  const token = params.get("token");

  const accept = async () => {
    await fetch("/api/households/join", { method: "POST", body: JSON.stringify({ token }) });
    alert("Invite accepted");
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">Accept Household Invite</h1>
      <Button onClick={accept} disabled={!token}>Join Household</Button>
    </section>
  );
}
