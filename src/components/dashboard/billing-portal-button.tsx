"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      if (!res.ok) {
        console.error("[billing-portal] error:", res.status);
        setError("Une erreur est survenue. Veuillez réessayer.");
        setLoading(false);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      if (url) {
        window.location.href = url;
      } else {
        console.error("[billing-portal] no url in response");
        setError("URL du portail manquante. Veuillez réessayer.");
        setLoading(false);
      }
    } catch (e) {
      console.error("[billing-portal] fetch error:", e);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        className="rounded-full"
      >
        {loading ? "Chargement…" : "Gérer mon abonnement"}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
