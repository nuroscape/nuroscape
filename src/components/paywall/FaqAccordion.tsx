"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, à tout moment depuis votre espace ou en 1 clic. Aucun engagement.",
  },
  {
    q: "Mes réponses sont-elles privées ?",
    a: "Oui. Données anonymes, chiffrées, hébergées en Europe. Jamais revendues.",
  },
  {
    q: "Combien de temps prend la lecture ?",
    a: "Environ 10-15 minutes. Rapport téléchargeable, disponible en permanence.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p
        className="font-heading font-light text-lg text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Questions fréquentes
      </p>

      <div className="space-y-1.5">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-border/50 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
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
              <div className="px-4 pb-3.5 border-t border-border/30">
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
