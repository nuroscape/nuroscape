import { Brain, Zap, Target, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ContentCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const CARDS: ContentCard[] = [
  {
    icon: Brain,
    title: "Vos 3 forces cognitives",
    description: "Vos patterns positifs à exploiter.",
  },
  {
    icon: Zap,
    title: "Votre profil énergétique",
    description: "Cycles d'attention et d'hyperactivité.",
  },
  {
    icon: Target,
    title: "5 recommandations",
    description: "Actions concrètes adaptées.",
  },
  {
    icon: Compass,
    title: "Vos prochaines étapes",
    description: "Plan clair pour avancer.",
  },
];

export function ReportContents() {
  return (
    <div className="space-y-3">
      <p
        className="font-heading font-light text-lg text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Ce que contient votre rapport
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {CARDS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl px-3 py-3 space-y-2 border border-border/30"
            style={{ backgroundColor: "oklch(0.96 0.012 168)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "oklch(0.88 0.036 168)" }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: "oklch(0.42 0.128 168)" }} aria-hidden />
            </div>
            <p
              className="font-heading font-light text-sm text-foreground tracking-[-0.01em] leading-snug"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
            >
              {title}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
