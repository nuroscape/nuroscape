import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { FakeReportPreview } from "@/components/paywall/FakeReportPreview";
import { ScorePreview } from "@/components/paywall/ScorePreview";
import { ReportContents } from "@/components/paywall/ReportContents";
import { HowItWorks } from "@/components/paywall/HowItWorks";
import { WhyNuroscape } from "@/components/paywall/WhyNuroscape";
import { FaqAccordion } from "@/components/paywall/FaqAccordion";
import { PricingCard } from "@/components/paywall/PricingCard";

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
    <div className="w-full max-w-lg space-y-10 pb-16">
      {/* ── 1. Hero ─────────────────────────────────────────────────── */}
      <div className="space-y-6">
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

        {/* What's included checklist */}
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
      </div>

      {/* ── 2. Score preview ────────────────────────────────────────── */}
      <ScorePreview />

      {/* ── 3. Fake blurred report preview ──────────────────────────── */}
      <div className="relative rounded-2xl border border-border/40 overflow-hidden px-6 py-6">
        <FakeReportPreview />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent via-background/60 to-background pb-6 items-center">
          <div className="flex items-center gap-2.5 bg-background/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-border/40">
            <LockIcon />
            <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
          </div>
        </div>
      </div>

      {/* ── 4. CTA #1 ───────────────────────────────────────────────── */}
      <PricingCard sessionId={session} />

      {/* ── 5. What's in your report ────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <ReportContents />
      </div>

      {/* ── 6. How it works ─────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <HowItWorks />
      </div>

      {/* ── 7. Why Nuroscape ────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <WhyNuroscape />
      </div>

      {/* ── 8. CTA #2 ───────────────────────────────────────────────── */}
      <PricingCard sessionId={session} />

      {/* ── 9. FAQ ──────────────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <FaqAccordion />
      </div>

      {/* ── 10. CTA #3 final ────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <PricingCard
          sessionId={session}
          title="Découvrez votre profil en 1 clic"
          showBottomStrip
        />
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
