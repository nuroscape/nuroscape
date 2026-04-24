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
    description: "Identifiez vos patterns positifs et capitalisez dessus.",
  },
  {
    icon: Zap,
    title: "Votre profil énergétique",
    description: "Comprenez vos cycles d'attention et d'hyperactivité.",
  },
  {
    icon: Target,
    title: "5 recommandations concrètes",
    description: "Des actions adaptées à votre profil, pas des conseils génériques.",
  },
  {
    icon: Compass,
    title: "Vos prochaines étapes",
    description: "Un plan clair pour avancer, sans vous sentir submergé.",
  },
];

export function ReportContents() {
  return (
    <div className="space-y-4">
      <p
        className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Ce que contient votre rapport
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARDS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl px-4 py-4 space-y-2.5 border border-border/30"
            style={{ backgroundColor: "oklch(0.96 0.012 168)" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "oklch(0.88 0.036 168)" }}
            >
              <Icon className="w-4 h-4" style={{ color: "oklch(0.42 0.128 168)" }} aria-hidden />
            </div>
            <p
              className="font-heading font-light text-base text-foreground tracking-[-0.01em]"
              style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
            >
              {title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
