import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
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
        Contact
      </h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Pour toute question, vous pouvez nous contacter à l&apos;adresse suivante.
        Le formulaire de contact sera disponible prochainement.
      </p>
      <div className="border-t border-border pt-8 space-y-4 text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground mb-1">Email</p>
          <p>Contenu en cours de rédaction.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Délai de réponse</p>
          <p>Nous nous engageons à répondre sous 48 heures ouvrées.</p>
        </div>
      </div>
    </section>
  );
}
