"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "Est-ce un diagnostic médical ?",
    a: "Non. Nuroscape propose une analyse de profil basée sur des questionnaires reconnus. Pour un diagnostic, consultez un professionnel de santé.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, à tout moment depuis votre espace personnel ou en 1 clic par email. Aucun engagement.",
  },
  {
    q: "Mes réponses sont-elles privées ?",
    a: "Oui. Vos données sont anonymes, chiffrées, hébergées en Europe. Elles ne sont jamais revendues.",
  },
  {
    q: "Combien de temps prend la lecture du rapport ?",
    a: "Environ 10-15 minutes. Le rapport est téléchargeable et disponible en permanence dans votre espace.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p
        className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Questions fréquentes
      </p>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-border/50 rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="text-sm font-medium text-foreground">{faq.q}</span>
              <ChevronDown
                className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200"
                style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden
              />
            </button>
            {open === i && (
              <div className="px-5 pb-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
