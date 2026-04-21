"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/stores/quiz-store";

export default function MerciPage() {
  const { reset } = useQuizStore();

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="text-center space-y-6 max-w-sm">
      {/* Checkmark */}
      <div className="mx-auto w-16 h-16 rounded-full bg-surface-mint flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          aria-hidden
        >
          <path d="M4 14l7 7L24 6" />
        </svg>
      </div>

      <div className="space-y-3">
        <h1
          className="font-heading font-light text-3xl text-foreground tracking-[-0.02em]"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Paiement confirmé.
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Votre rapport est en cours de préparation. Vous recevrez un email
          avec un lien pour y accéder dans quelques instants.
        </p>
        <p className="text-sm text-muted-foreground">
          Pensez à vérifier vos spams si vous ne recevez rien sous 2 minutes.
        </p>
      </div>

      <Button
        render={<Link href="/" />}
        variant="ghost"
        className="rounded-full text-muted-foreground"
      >
        ← Retour à l&apos;accueil
      </Button>
    </div>
  );
}
