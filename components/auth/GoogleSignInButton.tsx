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
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12 9.6 9.6 0 0 0 12 21.6c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.5H12z" />
            <path fill="#34A853" d="M2.4 12c0 1.5.4 3 1.2 4.2l3.4-2.7c-.2-.5-.4-1-.4-1.5s.1-1 .4-1.5L3.6 7.8A9.5 9.5 0 0 0 2.4 12z" />
            <path fill="#FBBC05" d="M12 21.6c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 1-3.3 1-2.6 0-4.8-1.8-5.5-4.1l-3.5 2.7A9.6 9.6 0 0 0 12 21.6z" />
            <path fill="#4285F4" d="M21.1 12.4c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.2 1.1-.9 2-1.9 2.6l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7.3z" />
          </svg>
          {loading ? "Connecting to Google..." : "Continue with Google"}
        </span>
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
