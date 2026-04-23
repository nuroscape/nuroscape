import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { CheckoutButton } from "./checkout-button";
import { FakeReportPreview } from "@/components/paywall/FakeReportPreview";

export default async function PaywallPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;

  if (!session) redirect("/quiz");

  const supabase = await createAdminClient();
  const result = await supabase
    .from("assessments")
    .select("session_id")
    .eq("session_id", session)
    .maybeSingle();

  if (!result.data) redirect("/quiz");

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Status banner */}
      <div className="flex items-center gap-3 bg-surface-mint rounded-2xl px-5 py-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
        >
          <CheckIcon />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Votre profil a été analysé.
          </p>
          <p className="text-xs text-muted-foreground">
            Votre rapport personnalisé est prêt.
          </p>
        </div>
      </div>

      {/* What's included */}
      <div className="space-y-3">
        <p
          className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Votre rapport personnalisé comprend :
        </p>
        <ul className="space-y-2">
          {[
            "5 sections d'analyse approfondie",
            "Vos forces cognitives identifiées",
            "Vos patterns d'attention et d'énergie",
            "5 recommandations adaptées à vous",
            "3 prochaines étapes concrètes",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: "oklch(0.42 0.128 168)" }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Fake blurred preview with gradient overlay */}
      <div className="relative rounded-2xl border border-border/40 overflow-hidden px-6 py-6">
        <FakeReportPreview />

        {/* Gradient fade to background + lock badge at bottom */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent via-background/60 to-background pb-6 items-center">
          <div className="flex items-center gap-2.5 bg-background/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-border/40">
            <LockIcon />
            <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
          </div>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div
        className="rounded-2xl p-6 text-primary-foreground"
        style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
      >
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-heading font-light text-4xl tracking-tight"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            1,99 €
          </span>
          <span className="text-primary-foreground/70 text-sm">/ 7 jours</span>
        </div>
        <p className="text-primary-foreground/65 text-sm mb-6">
          Puis 14,99 €/mois — résiliable à tout moment
        </p>

        <CheckoutButton sessionId={session} />

        <p className="text-center text-[11px] text-primary-foreground/50 mt-3">
          Essai 7 jours · 1,99€ puis 14,99€/mois · Résiliable à tout moment
        </p>

        <div className="flex justify-center gap-5 mt-4">
          {["Paiement sécurisé", "Sans engagement", "Données protégées"].map((item) => (
            <span key={item} className="text-[11px] text-primary-foreground/50">
              ✓ {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-foreground"
      aria-hidden
    >
      <path d="M2 7l3.5 3.5L12 3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-muted-foreground"
      aria-hidden
    >
      <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
