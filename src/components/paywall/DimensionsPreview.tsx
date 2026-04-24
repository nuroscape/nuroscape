import type React from "react";
import { Eye, Zap, Heart, Brain, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Dimension = {
  icon: LucideIcon;
  label: string;
  fill: number;
};

/*
 * SECURITY NOTE: fill values are compile-time constants — same for every
 * user, never fetched from DB. "XX/20" is intentionally opaque placeholder.
 */
const DIMENSIONS: Dimension[] = [
  { icon: Eye,   label: "Votre profil d'attention",      fill: 68 },
  { icon: Zap,   label: "Votre niveau d'énergie",        fill: 52 },
  { icon: Heart, label: "Votre régulation émotionnelle", fill: 74 },
  { icon: Brain, label: "Vos fonctions exécutives",      fill: 61 },
  { icon: Sun,   label: "L'impact sur votre quotidien",  fill: 58 },
];

export function DimensionsPreview() {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map(({ icon: Icon, label, fill }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "oklch(0.42 0.128 168)" }}
            aria-hidden
          />
          <span className="text-xs text-foreground/75 flex-shrink-0 w-40 truncate">{label}</span>
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "oklch(0.90 0.024 168)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${fill}%`,
                backgroundColor: "oklch(0.42 0.128 168)",
              }}
            />
          </div>
          <span
            className="text-[10px] text-foreground/50 flex-shrink-0 w-9 text-right tabular-nums select-none pointer-events-none"
            style={
              { filter: "blur(4px)", WebkitUserDrag: "none" } as React.CSSProperties
            }
            aria-hidden
          >
            XX/20
          </span>
        </div>
      ))}
    </div>
  );
}
