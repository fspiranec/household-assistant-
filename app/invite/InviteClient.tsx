"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function InviteClient() {
  const params = useSearchParams();
  const token = params.get("token");

  const accept = async () => {
    await fetch("/api/households/join", {
      method: "POST",
      body: JSON.stringify({ token })
    });
    alert("Invite accepted");
  };

  return <Button onClick={accept} disabled={!token}>Join Household</Button>;
}
