"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const { url, error } = (await res.json()) as { url?: string; error?: string };
      if (error || !url) throw new Error(error ?? "Checkout failed");
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      size="lg"
      className="w-full rounded-full font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Redirection…
        </span>
      ) : (
        "Accéder à mon rapport →"
      )}
    </Button>
  );
}
