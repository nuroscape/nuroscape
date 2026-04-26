"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      if (!res.ok) {
        console.error("[billing-portal] error:", res.status);
        setLoading(false);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      if (url) window.location.href = url;
    } catch (e) {
      console.error("[billing-portal] fetch error:", e);
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full"
    >
      {loading ? "Chargement…" : "Gérer mon abonnement"}
    </Button>
  );
}
