import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
        <p
          className="font-heading font-light text-8xl text-primary/20 select-none"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          aria-hidden
        >
          404
        </p>
        <div className="space-y-2">
          <h1
            className="font-heading font-light text-2xl text-foreground tracking-[-0.015em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Page introuvable.
          </h1>
          <p className="text-sm text-muted-foreground">
            Cette page n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
