import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { Json } from "@/types/database";
import type { ReportJSON } from "@/lib/openai/generate-report";
import type { ScoresJson } from "@/data/questions";
import { AutoRefresh } from "./auto-refresh";

export const metadata: Metadata = { title: "Mon rapport TDAH | Nuroscape" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parent (app) layout handles unauthenticated redirect, but guard anyway
  if (!user) redirect("/login");

  const result = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const assessment = result.data as Tables<"assessments"> | null;

  if (!assessment) notFound();

  if (!assessment.paid) {
    redirect(`/paywall?session=${assessment.session_id}`);
  }

  const report = assessment.report as Json as (ReportJSON & { disclaimer?: string }) | null;

  if (!report) {
    return <ReportPendingView />;
  }

  const scores = assessment.scores as Json as ScoresJson | null;

  const date = new Date(assessment.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Back nav */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow />
          Tableau de bord
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          Évaluation du {date}
        </p>
        <h1
          className="font-heading font-light text-3xl sm:text-4xl text-foreground tracking-[-0.02em]"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Votre rapport TDAH
        </h1>
      </div>

      {/* Score pills */}
      {scores && (
        <div className="flex flex-wrap gap-3">
          <ScorePill label="Inattention" score={scores.inattention} />
          <ScorePill label="Hyperactivité" score={scores.hyperactivity} />
          <ScorePill label="Score global" score={scores.global} highlight />
        </div>
      )}

      {/* Intro */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ backgroundColor: "oklch(0.96 0.012 168)" }}
      >
        <p className="text-foreground/90 leading-relaxed text-sm sm:text-base">
          {report.intro}
        </p>
      </div>

      {/* Sections */}
      {report.sections?.map((section, i) => (
        <div key={i} className="space-y-3">
          <h2
            className="font-heading font-light text-xl text-foreground tracking-[-0.01em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {section.title}
          </h2>
          <p className="text-foreground/80 leading-relaxed text-sm sm:text-base">
            {section.content}
          </p>
        </div>
      ))}

      {/* Strengths */}
      {report.strengths && (
        <div
          className="rounded-2xl px-6 py-5 space-y-3"
          style={{ backgroundColor: "oklch(0.96 0.012 168)" }}
        >
          <h2
            className="font-heading font-light text-xl text-foreground tracking-[-0.01em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {report.strengths.title}
          </h2>
          <ul className="space-y-2">
            {report.strengths.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && (
        <div
          className="rounded-2xl px-6 py-5 space-y-3"
          style={{ backgroundColor: "oklch(0.42 0.128 168)", color: "oklch(0.97 0.008 168)" }}
        >
          <h2
            className="font-heading font-light text-xl tracking-[-0.01em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {report.recommendations.title}
          </h2>
          <ul className="space-y-2">
            {report.recommendations.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm opacity-90">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {report.next_steps && (
        <div className="space-y-3">
          <h2
            className="font-heading font-light text-xl text-foreground tracking-[-0.01em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {report.next_steps.title}
          </h2>
          <ol className="space-y-3">
            {report.next_steps.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground"
                  style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
                >
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Disclaimer */}
      {report.disclaimer && (
        <p className="text-xs text-muted-foreground border-t border-border/40 pt-6 leading-relaxed">
          {report.disclaimer}
        </p>
      )}
    </div>
  );
}

function ReportPendingView() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <AutoRefresh delayMs={5000} />
      <div className="flex flex-col items-center justify-center py-24 gap-8 text-center">
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              backgroundColor: "oklch(0.42 0.128 168 / 0.15)",
              animationDuration: "2s",
            }}
          />
          <div
            className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
          >
            <div className="w-2 h-2 rounded-full bg-white/80" />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <h1
            className="font-heading font-light text-2xl text-foreground tracking-[-0.015em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Votre rapport est en cours de génération.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette page se rafraîchit automatiquement. Cela prend généralement
            moins d&apos;une minute.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  score,
  highlight = false,
}: {
  label: string;
  score: { raw: number; max: number; percent: number };
  highlight?: boolean;
}) {
  return (
    <div
      className="inline-flex flex-col items-center rounded-2xl px-4 py-2.5 min-w-[96px]"
      style={
        highlight
          ? { backgroundColor: "oklch(0.42 0.128 168)", color: "oklch(0.97 0.008 168)" }
          : { backgroundColor: "oklch(0.96 0.012 168)", color: "oklch(0.35 0.10 168)" }
      }
    >
      <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">
        {label}
      </span>
      <span className="font-heading font-light text-2xl tracking-tight" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}>
        {score.raw}
        <span className="text-sm opacity-60">/{score.max}</span>
      </span>
    </div>
  );
}

function BackArrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}
