import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ReportJSON } from "@/lib/openai/generate-report";
import { CheckoutButton } from "./checkout-button";

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
    .select("*")
    .eq("session_id", session)
    .maybeSingle();

  const assessment = result.data as Tables<"assessments"> | null;
  if (!assessment) redirect("/quiz");

  const report = assessment.report as (ReportJSON & { disclaimer?: string }) | null;

  // Show actual section titles from the generated report when available
  const sectionTitles: string[] = report?.sections?.slice(0, 5).map((s) => s.title) ?? [
    "Votre profil d'inattention",
    "Votre profil d'hyperactivité et impulsivité",
    "Régulation émotionnelle",
    "Recommandations personnalisées",
    "Prochaines étapes concrètes",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-5 flex justify-center">
        <span
          className="font-heading font-light text-lg tracking-[-0.01em] text-foreground"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          nuroscape
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-6 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Status banner */}
          <div className="flex items-center gap-3 bg-surface-mint rounded-2xl px-5 py-4">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <CheckIcon />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Analyse complète</p>
              <p className="text-xs text-muted-foreground">Vos réponses ont été analysées</p>
            </div>
          </div>

          {/* Locked report preview */}
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40">
              <h1
                className="font-heading font-light text-2xl text-foreground tracking-[-0.015em]"
                style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
              >
                Votre rapport est prêt.
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Débloquez-le pour accéder à votre analyse complète.
              </p>
            </div>

            <div className="px-6 py-5 space-y-3 relative">
              {/* Blurred section titles */}
              <div className="space-y-2.5 blur-[3px] pointer-events-none select-none" aria-hidden>
                {sectionTitles.map((title) => (
                  <div key={title} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">{title}</span>
                    <span className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
                      Prêt
                    </span>
                  </div>
                ))}
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/90 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-2.5 shadow-sm border border-border/40">
                  <LockIcon />
                  <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing card */}
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

            <div className="flex justify-center gap-5 mt-5">
              {["Paiement sécurisé", "Sans engagement", "Données protégées"].map((item) => (
                <span key={item} className="text-[11px] text-primary-foreground/50">
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
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
