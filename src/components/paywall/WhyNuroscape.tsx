import { Shield, Sparkles, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Bullet = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const BULLETS: Bullet[] = [
  {
    icon: Shield,
    title: "Basé sur l'ASRS-v1.1 OMS",
    description: "Outil officiel reconnu internationalement.",
  },
  {
    icon: Sparkles,
    title: "Personnalisé par IA",
    description: "Rapport unique généré pour votre profil.",
  },
  {
    icon: Lock,
    title: "Données protégées",
    description: "Anonymes, conformes RGPD, jamais revendues.",
  },
];

export function WhyNuroscape() {
  return (
    <div className="space-y-4">
      <p
        className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Pourquoi Nuroscape
      </p>

      <div className="flex flex-col sm:flex-row gap-5">
        {BULLETS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex-1 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "oklch(0.88 0.036 168)" }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: "oklch(0.42 0.128 168)" }}
                aria-hidden
              />
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
