import { Eye, Zap, Heart, Brain, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Dimension = {
  label: string;
  icon: LucideIcon;
  fill: number;
  display: string;
};

const DIMENSIONS: Dimension[] = [
  { label: "Votre profil d'attention",      icon: Eye,   fill: 68, display: "68/100" },
  { label: "Votre niveau d'énergie",        icon: Zap,   fill: 72, display: "72/100" },
  { label: "Votre régulation émotionnelle", icon: Heart, fill: 65, display: "65/100" },
  { label: "Vos fonctions exécutives",      icon: Brain, fill: 70, display: "70/100" },
  { label: "L'impact sur votre quotidien",  icon: Sun,   fill: 67, display: "67/100" },
];

export function ScorePreview() {
  return (
    <div className="rounded-2xl border border-border/40 px-5 py-5 space-y-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Votre analyse dimensionnelle
      </p>

      <div className="space-y-4">
        {DIMENSIONS.map(({ label, icon: Icon, fill, display }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.42 0.128 168)" }}
                  aria-hidden
                />
                <span className="text-xs text-foreground/80">{label}</span>
              </div>
              <span
                className="text-xs font-medium text-foreground/60 select-none tabular-nums"
                style={{ filter: "blur(4px)" }}
                aria-hidden
              >
                {display}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.90 0.024 168)" }}>
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${fill}%`,
                  backgroundColor: "oklch(0.42 0.128 168)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
        Valeurs exactes visibles après déblocage
      </p>
    </div>
  );
}
