import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TRUST_BADGES = [
  { icon: "⏱", label: "18 minutes" },
  { icon: "🔒", label: "100 % confidentiel" },
  { icon: "🤝", label: "Sans jugement" },
];

const FEATURES = [
  {
    number: "01",
    title: "Répondez à 18 questions",
    description:
      "Des questions cliniquement validées sur votre attention, vos habitudes et votre quotidien.",
  },
  {
    number: "02",
    title: "Recevez votre rapport",
    description:
      "Un rapport personnalisé généré par IA, rédigé avec bienveillance et nuance.",
  },
  {
    number: "03",
    title: "Comprenez votre profil",
    description:
      "Des insights actionnables pour mieux vous connaître et orienter vos prochaines étapes.",
  },
];

export function Hero() {
  return (
    <>
      {/* ─── Hero section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-28 sm:pt-28 sm:pb-36">
        {/* Background decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/3" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border border-primary/20 bg-primary/8 text-primary"
            >
              Évaluation TDAH · Basée sur les critères DSM-5
            </Badge>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground mb-6">
              Votre cerveau
              <br />
              <em className="not-italic text-primary">mérite</em> d'être
              <br />
              compris.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Une auto-évaluation bienveillante et rigoureuse pour explorer si
              le TDAH fait partie de votre histoire — en moins de 20 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
              <Button
                render={<Link href="/quiz" />}
                size="lg"
                className="rounded-full px-8 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Commencer mon évaluation
                <svg
                  className="ml-2 w-4 h-4"
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
              </Button>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">1,99 €</span> pour 7 jours
                — puis 14,99 €/mois
              </p>
            </div>

            <div className="flex flex-wrap gap-5">
              {TRUST_BADGES.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────── */}
      <section
        id="comment-ca-marche"
        className="px-6 py-20 bg-muted/40 border-y border-border"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            Comment ça fonctionne
          </h2>
          <p className="text-muted-foreground mb-12 max-w-lg">
            Un processus simple et guidé, conçu pour être accessible à tous.
          </p>

          <div className="grid sm:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.number} className="relative">
                <div className="text-5xl font-heading font-bold text-primary/15 mb-4 leading-none">
                  {f.number}
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing CTA ──────────────────────────────────────────── */}
      <section id="tarifs" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-primary rounded-3xl p-8 sm:p-12 text-primary-foreground relative overflow-hidden">
            <div
              aria-hidden
              className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"
            />
            <div className="relative">
              <p className="text-primary-foreground/70 text-sm font-medium mb-3 uppercase tracking-widest">
                Tarifs transparents
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold mb-4">
                Commencez pour
                <br />
                <span className="text-accent">1,99 €</span> seulement
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md leading-relaxed">
                7 jours d&apos;accès complet. Accédez à votre rapport, vos insights
                et vos recommandations personnalisées. Puis 14,99 €/mois, sans
                engagement.
              </p>
              <Button
                render={<Link href="/register" />}
                variant="secondary"
                size="lg"
                className="rounded-full px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
              >
                Démarrer l&apos;essai gratuit
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
