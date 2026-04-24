import { CheckoutButton } from "@/app/paywall/checkout-button";

export function PricingCard({
  sessionId,
  title,
  showBottomStrip = false,
}: {
  sessionId: string;
  title?: string;
  showBottomStrip?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl p-6 text-primary-foreground"
        style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
      >
        {title && (
          <p
            className="font-heading font-light text-2xl tracking-[-0.015em] mb-5"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {title}
          </p>
        )}

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

        <CheckoutButton sessionId={sessionId} />

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

      {showBottomStrip && (
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          ✓ Paiement sécurisé Stripe · ✓ Sans engagement · ✓ Données RGPD
        </p>
      )}
    </div>
  );
}
