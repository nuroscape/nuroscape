import type React from "react";

export function GlobalScoreBlur() {
  return (
    <div
      className="flex flex-col items-center gap-2 py-2"
      aria-label="Score global — disponible après déblocage"
    >
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Mint background fill */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: "oklch(0.96 0.012 168)" }}
          aria-hidden
        />
        {/* Teal ring */}
        <div
          className="absolute inset-0 rounded-full border-[3px]"
          style={{ borderColor: "oklch(0.42 0.128 168)" }}
          aria-hidden
        />
        {/* Outer glow ring */}
        <div
          className="absolute -inset-1.5 rounded-full opacity-30"
          style={{ boxShadow: "0 0 0 6px oklch(0.42 0.128 168)" }}
          aria-hidden
        />
        {/*
         * SECURITY NOTE: "73" and "/100" are compile-time constants.
         * They are NOT derived from the user's assessment, NOT fetched
         * from DB, and identical for every single visitor.
         * Disabling CSS reveals "73" — which is intentionally a
         * universal placeholder, not the user's actual score.
         * The blur(10px) is the visual gate; the number is decorative.
         */}
        <div
          className="flex items-baseline gap-0.5 select-none pointer-events-none"
          style={{ filter: "blur(10px)", WebkitUserDrag: "none" } as React.CSSProperties}
          aria-hidden
        >
          <span
            className="font-heading font-light text-5xl"
            style={{
              color: "oklch(0.42 0.128 168)",
              fontVariationSettings: '"SOFT" 100, "WONK" 0',
            }}
          >
            XX
          </span>
          <span className="text-lg font-medium" style={{ color: "oklch(0.42 0.128 168)" }}>
            /100
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground" aria-hidden>
        Votre score global
      </p>
    </div>
  );
}
