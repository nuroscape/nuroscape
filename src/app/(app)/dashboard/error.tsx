"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] error boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 px-6 text-center">
      <div className="space-y-2">
        <h2
          className="font-heading font-light text-2xl text-foreground tracking-[-0.015em]"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Une erreur est survenue.
        </h2>
        <p className="text-sm text-muted-foreground">
          Impossible de charger vos données. Vérifiez votre connexion et réessayez.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-primary-foreground transition-colors"
          style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
