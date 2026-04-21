import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─── Data ──────────────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    id: "p1",
    headline: "47 onglets ouverts, 0 projet terminé.",
    body: "Vous commencez avec enthousiasme, puis l'élan s'évapore. Ce n'est pas un manque de volonté — c'est peut-être la façon dont votre cerveau gère l'attention.",
  },
  {
    id: "p2",
    headline: "\"Tu n'écoutes pas\" — mais vous, vous savez que si.",
    body: "Votre esprit ne s'arrête jamais vraiment de tourner. Sauf que parfois, il tourne trop vite pour se poser là où les autres voudraient que vous soyez.",
  },
  {
    id: "p3",
    headline: "Ces moments de flow parfait… et le reste.",
    body: "Quand le sujet vous passionne, vous pouvez travailler des heures sans voir le temps passer. Le reste du temps, même une tâche simple devient une montagne.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Répondez à quelques questions",
    body: "Conçues à partir des critères cliniques DSM-5, reformulées avec clarté et sans jargon médical.",
  },
  {
    n: "2",
    title: "Votre profil est analysé",
    body: "Vos réponses sont examinées en profondeur pour identifier les patterns propres à votre façon de fonctionner.",
  },
  {
    n: "3",
    title: "Votre rapport sur-mesure",
    body: "Un document détaillé avec vos résultats, des insights actionnables et des pistes concrètes pour la suite.",
  },
];

const TESTIMONIALS = [
  {
    id: "t1",
    quote:
      "J'avais toujours cru que c'était juste du stress chronique. Le rapport m'a aidée à mettre des mots sur quelque chose que je vivais depuis l'enfance sans jamais pouvoir l'expliquer.",
    name: "Camille R.",
    context: "28 ans · Graphiste indépendante",
  },
  {
    id: "t2",
    quote:
      "J'attendais un jargon médical oppressant. J'ai trouvé quelque chose de bienveillant, nuancé, qui ne m'a pas fait sentir cassé. Rare.",
    name: "Thomas M.",
    context: "34 ans · Développeur",
  },
  {
    id: "t3",
    quote:
      "J'ai commencé pour mieux comprendre mon fils. C'est moi qui me suis reconnue dans presque toutes les situations. Révélateur.",
    name: "Sophie D.",
    context: "42 ans · Mère de deux enfants",
  },
];

// ─── Hero ──────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <>
      {/* ── 1. Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32 sm:pt-28 sm:pb-40">
        {/* Background blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full bg-coral/7 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-12">
          {/* Left: text */}
          <div className="flex-1">
            <p className="mb-7 text-xs font-medium uppercase tracking-[0.12em] text-primary/80">
              Évaluation TDAH · Basée sur le DSM-5
            </p>

            <h1
              className="font-heading font-light text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.08] tracking-[-0.02em] text-foreground mb-7 max-w-2xl"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
            >
              Votre cerveau{" "}
              <em className="not-italic text-primary">mérite</em>
              <br />
              d&apos;être compris.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Une auto-évaluation bienveillante et rigoureuse pour explorer si le
              TDAH fait partie de votre histoire.
            </p>

            <Button
              render={<Link href="/quiz" />}
              size="lg"
              className="rounded-full px-9 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 transition-all duration-200"
            >
              Commencer maintenant
              <ArrowRight />
            </Button>

            <div className="flex flex-wrap gap-x-7 gap-y-3 mt-10">
              {["Quelques minutes", "100 % confidentiel", "Sans jugement", "Rapport personnalisé"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right: abstract decoration — lg+ only */}
          <div
            aria-hidden
            className="hidden lg:flex flex-shrink-0 w-72 h-72 items-center justify-center relative pointer-events-none"
          >
            {/* Concentric rings */}
            <div className="absolute inset-0 rounded-full border border-primary/10" />
            <div className="absolute inset-[14%] rounded-full border border-coral/12" />
            <div className="absolute inset-[30%] rounded-full bg-primary/7" />
            {/* Accent dots */}
            <div className="absolute top-[14%] right-[22%] w-3 h-3 rounded-full bg-coral/35" />
            <div className="absolute bottom-[18%] left-[18%] w-2 h-2 rounded-full bg-primary/30" />
            <div className="absolute top-[48%] right-[6%] w-2 h-2 rounded-full bg-coral/20" />
            <div className="absolute top-[70%] right-[30%] w-1.5 h-1.5 rounded-full bg-primary/25" />
            {/* Soft blurred accent */}
            <div className="absolute -right-6 top-[20%] w-20 h-20 rounded-full bg-coral/15 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ── 2. Problem ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-28 bg-surface-mint">
        <div className="max-w-5xl mx-auto">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-primary/70">
            Ce que vous vivez
          </p>
          <h2
            className="font-heading font-light text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.015em] text-foreground mb-14 max-w-lg"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Vous vous reconnaissez ici ?
          </h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {PROBLEMS.map((p) => (
              <div
                key={p.id}
                className="bg-background rounded-2xl p-7 border-l-4 border-coral shadow-sm"
              >
                <h3 className="font-heading font-medium text-lg leading-snug text-foreground mb-3">
                  {p.headline}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How it works ──────────────────────────────────────────── */}
      <section
        id="comment-ca-marche"
        className="px-6 py-20 sm:py-28 bg-background"
      >
        <div className="max-w-5xl mx-auto">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-primary/70">
            Comment ça marche
          </p>
          <h2
            className="font-heading font-light text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.015em] text-foreground mb-16 max-w-lg"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Trois étapes. Un rapport qui vous ressemble.
          </h2>

          <div className="grid sm:grid-cols-3 gap-10 sm:gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div
                  className="font-heading font-light text-[5.5rem] leading-none text-primary/10 mb-3 select-none"
                  aria-hidden
                  style={{ fontVariationSettings: '"SOFT" 0, "WONK" 0' }}
                >
                  {s.n}
                </div>
                <h3 className="font-heading font-medium text-lg text-foreground mb-2 leading-snug">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Testimonials ──────────────────────────────────────────── */}
      <section
        id="temoignages"
        className="px-6 py-20 sm:py-28"
        style={{ backgroundColor: "oklch(0.24 0.08 168)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-primary-foreground/50">
            Témoignages
          </p>
          <h2
            className="font-heading font-light text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.015em] text-primary-foreground mb-14 max-w-lg"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Ce qu&apos;ils ont découvert.
          </h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.id}
                className="rounded-2xl p-7"
                style={{ backgroundColor: "oklch(0.30 0.09 168)" }}
              >
                <div className="flex gap-0.5 mb-5" aria-label="5 étoiles">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <blockquote className="text-sm text-primary-foreground/85 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <p className="text-sm font-medium text-primary-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-primary-foreground/50 mt-0.5">
                    {t.context}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Final CTA ─────────────────────────────────────────────── */}
      <section id="tarifs" className="px-6 py-20 sm:py-28 bg-background">
        <div className="max-w-5xl mx-auto">
          <div
            className="px-8 sm:px-16 py-16 sm:py-20 text-center text-primary-foreground"
            style={{
              backgroundColor: "oklch(0.24 0.08 168)",
              borderRadius: "2rem",
            }}
          >
            <h2
              className="font-heading font-light text-3xl sm:text-4xl leading-tight tracking-[-0.02em] text-primary-foreground mb-5 whitespace-nowrap"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
            >
              Prêt à vous connaître, enfin ?
            </h2>
            <p className="text-base text-primary-foreground/65 mb-10 max-w-sm mx-auto leading-relaxed">
              Un rapport sur-mesure pour comprendre comment votre cerveau
              fonctionne — et ce dont vous avez besoin.
            </p>
            <Button
              render={<Link href="/quiz" />}
              size="lg"
              className="rounded-full px-10 text-base font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg shadow-black/15 hover:-translate-y-0.5 transition-all duration-200"
            >
              Commencer maintenant
              <ArrowRight className="text-primary" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Micro-icons ───────────────────────────────────────────────────────────

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ml-2 w-4 h-4 flex-shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M6.5 1L7.9 4.8H12L8.8 7.2L10 11L6.5 8.7L3 11L4.2 7.2L1 4.8H5.1L6.5 1Z"
        fill="oklch(0.72 0.135 55)"
      />
    </svg>
  );
}
