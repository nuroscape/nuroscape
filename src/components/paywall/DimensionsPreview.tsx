import { Eye, Zap, Heart, Brain, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Dimension = {
  icon: LucideIcon;
  label: string;
  fill: number;
  display: string;
};

const DIMENSIONS: Dimension[] = [
  { icon: Eye,   label: "Votre profil d'attention",      fill: 68, display: "14/20" },
  { icon: Zap,   label: "Votre niveau d'énergie",        fill: 72, display: "15/20" },
  { icon: Heart, label: "Votre régulation émotionnelle", fill: 65, display: "13/20" },
  { icon: Brain, label: "Vos fonctions exécutives",      fill: 70, display: "14/20" },
  { icon: Sun,   label: "L'impact sur votre quotidien",  fill: 67, display: "13/20" },
];

export function DimensionsPreview() {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map(({ icon: Icon, label, fill, display }) => (
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
            style={{ filter: "blur(4px)" }}
            aria-hidden
          >
            {display}
          </span>
        </div>
      ))}
    </div>
  );
}
