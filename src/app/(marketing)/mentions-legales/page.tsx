import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-20">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 inline-block"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1
        className="font-heading font-light text-4xl text-foreground tracking-[-0.02em] mb-4"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Mentions légales
      </h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Les informations légales relatives à Nuroscape sont en cours de rédaction.
        Cette page sera complétée avant le lancement officiel.
      </p>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        {["Éditeur", "Hébergement", "Propriété intellectuelle", "Responsabilité"].map((section) => (
          <div key={section} className="border-t border-border pt-6">
            <h2 className="font-medium text-foreground mb-2">{section}</h2>
            <p>Contenu en cours de rédaction.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
