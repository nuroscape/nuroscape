import { Shield, Sparkles, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Badge = {
  icon: LucideIcon;
  label: string;
};

const BADGES: Badge[] = [
  { icon: Shield,   label: "Basé sur l'ASRS-v1.1 OMS" },
  { icon: Sparkles, label: "Personnalisé par IA" },
  { icon: Lock,     label: "Données RGPD protégées" },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
      {BADGES.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon
            className="w-3 h-3 flex-shrink-0"
            style={{ color: "oklch(0.42 0.128 168)" }}
            aria-hidden
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
