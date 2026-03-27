"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type GoogleSignInButtonProps = {
  redirectTo?: string;
  className?: string;
};

export function GoogleSignInButton({ redirectTo = "/dashboard", className }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/google", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setLoading(false);
      setError(data.error || "Google sign-in is not available right now.");
      return;
    }

    const targetUrl = new URL(data.url);
    if (redirectTo) {
      targetUrl.searchParams.set("redirect_to", redirectTo);
    }
    window.location.assign(targetUrl.toString());
  };

  return (
    <div className="space-y-2">
      <Button type="button" className={className} onClick={startGoogleSignIn} disabled={loading}>
        {loading ? "Connecting to Google..." : "Continue with Google"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
