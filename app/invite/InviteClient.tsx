"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function InviteClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const redirectTarget = useMemo(() => token ? `/invite?token=${encodeURIComponent(token)}` : "/invite", [token]);
  const [message, setMessage] = useState(token ? "Checking invite..." : "Invite link is missing a token.");
  const [loading, setLoading] = useState(Boolean(token));
  const [needsLogin, setNeedsLogin] = useState(false);

  const acceptInvite = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setNeedsLogin(false);

    const res = await fetch("/api/households/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      setNeedsLogin(true);
      setMessage("Please log in or register to join this household automatically.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setMessage(data.error || "Unable to join household.");
      setLoading(false);
      return;
    }

    setMessage(data.message || "Joined household.");
    router.replace("/households");
    router.refresh();
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    acceptInvite();
  }, [acceptInvite, token]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{message}</p>

      {loading && <p className="text-sm text-slate-500">Joining household…</p>}

      {needsLogin && (
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}>
            <Button type="button">Log In to Join</Button>
          </Link>
          <Link href={`/register?redirect=${encodeURIComponent(redirectTarget)}`}>
            <Button type="button" className="bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">Register</Button>
          </Link>
        </div>
      )}

      {!loading && !needsLogin && token && (
        <Button type="button" onClick={acceptInvite}>Try Again</Button>
      )}
    </div>
  );
}
