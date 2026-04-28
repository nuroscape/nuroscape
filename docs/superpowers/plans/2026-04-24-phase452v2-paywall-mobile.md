# Phase 4.5.2 v2 — Paywall Mobile-Optimized Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 4.5.2 paywall with a compact mobile-first version — CTA visible within ~1100px, total page under 2500px — using a blurred global score circle, compact 5-gauge strip, and condensed secondary sections.

**Architecture:** Five new/modified components (GlobalScoreBlur, DimensionsPreview, TrustBadges, ReportContents update, FaqAccordion update) plus a full rewrite of `paywall/page.tsx` to compose them in spec order. Three obsolete components (ScorePreview, WhyNuroscape, HowItWorks) are deleted. All blur effects use inline `style={{ filter: "blur(Npx)" }}` plus Tailwind `select-none pointer-events-none`. `FaqAccordion` stays custom (`useState`) — the project uses `@base-ui/react`, not Radix, so shadcn's Radix-based Accordion is not available; the custom implementation is functionally identical.

**Tech Stack:** Next.js 16.2.4 App Router, TypeScript strict, Tailwind v4, lucide-react v1.8.0, existing `PricingCard` + `CheckoutButton` + `FakeReportPreview`.

---

## Mobile wireframe

```
┌──────────────────────────┐ ← 0px
│ [✓] Votre profil analysé │   badge ~56px
│     Rapport prêt.        │
│                          │
│ Votre rapport comprend : │   heading + 5 bullets ~148px
│ ✓ 5 sections d'analyse   │
│ ✓ Forces cognitives      │
│ ✓ Patterns d'attention   │
│ ✓ 5 recommandations      │
│ ✓ 3 prochaines étapes    │
├──────────────────────────┤ ← ~220px (gap 24px)
│         ◉  73            │   GlobalScoreBlur
│       ◉◉◉◉◉◉◉◉           │   teal ring, blur(10px) ~180px
│      ◉◉◉◉◉◉◉◉◉◉          │
│     Votre score global   │
├──────────────────────────┤ ← ~424px (gap 24px)
│ 👁 Profil attention ████░│   DimensionsPreview
│ ⚡ Niveau d'énergie  ████░│   5 compact rows ~140px
│ ♥ Régul. émo.       ████░│
│ 🧠 Fonctions exec.  ████░│
│ ☀ Impact quotidien  ████░│
├──────────────────────────┤ ← ~588px (gap 24px)
│ ░░░[rapport flouté]░░░░░ │   FakeReportPreview
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │   max-height 400px ~400px
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ~~~gradient fade~~~~~~~  │
│   🔒 Rapport verrouillé  │
├──────────────────────────┤ ← ~1012px (gap 24px)
│ ┌──────────────────────┐ │
│ │ 1,99 € / 7 jours     │ │   CTA #1 ~190px
│ │ [Accéder à rapport]  │ │ ← VISIBLE ~1012-1202px ✓ (<1500px)
│ └──────────────────────┘ │
├──────────────────────────┤ ← ~1226px (gap 24px)
│ Ce que contient :        │   ReportContents
│ ┌──────┐ ┌──────┐        │   2x2 compact grid ~270px
│ │ 🧠   │ │ ⚡   │        │
│ └──────┘ └──────┘        │
│ ┌──────┐ ┌──────┐        │
│ │ 🎯   │ │ 🧭   │        │
│ └──────┘ └──────┘        │
├──────────────────────────┤ ← ~1520px (gap 24px)
│ ┌──────────────────────┐ │   CTA #2 ~190px
│ │ 1,99 € / 7 jours     │ │
│ │ [Accéder à rapport]  │ │
│ └──────────────────────┘ │
├──────────────────────────┤ ← ~1734px (gap 24px)
│ 🛡 ASRS · ✨ IA · 🔒 RGPD │   TrustBadges ~50px
├──────────────────────────┤ ← ~1808px (gap 24px)
│ Questions fréquentes     │   FAQ (all closed)
│ ▾ Est-ce un diagnostic?  │   4 rows × 52px + heading ~236px
│ ▾ Puis-je annuler?       │
│ ▾ Réponses privées?      │
│ ▾ Combien de temps?      │
├──────────────────────────┤ ← ~2068px (gap 24px)
│ ┌──────────────────────┐ │   CTA #3 with title ~230px
│ │ Découvrez votre      │ │
│ │ profil maintenant    │ │
│ │ 1,99 € / 7 jours     │ │
│ │ [Accéder à rapport]  │ │
│ └──────────────────────┘ │
│ ✓ Paiement · ✓ Sans eng  │
└──────────────────────────┘ ← ~2298px ✓ (<3000px)
```

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/paywall/GlobalScoreBlur.tsx` | **Create** | Big blurred score circle with teal ring |
| `src/components/paywall/DimensionsPreview.tsx` | **Create** | 5 compact horizontal gauge rows |
| `src/components/paywall/TrustBadges.tsx` | **Create** | 3 inline micro-trust signals, max 80px |
| `src/components/paywall/ReportContents.tsx` | **Modify** | 2×2 on mobile, shorter descriptions |
| `src/components/paywall/FaqAccordion.tsx` | **Modify** | Shorter answer texts per spec |
| `src/app/paywall/page.tsx` | **Modify** | New section order, tighter spacing, updated wrapper |
| `src/components/paywall/ScorePreview.tsx` | **Delete** | Replaced by GlobalScoreBlur + DimensionsPreview |
| `src/components/paywall/WhyNuroscape.tsx` | **Delete** | Replaced by TrustBadges |
| `src/components/paywall/HowItWorks.tsx` | **Delete** | Removed per spec (compactness) |

No changes needed: `FakeReportPreview.tsx`, `PricingCard.tsx`, `checkout-button.tsx`.

---

## Task 1: GlobalScoreBlur — big blurred score circle

**Files:**
- Create: `src/components/paywall/GlobalScoreBlur.tsx`

Server component (pure display). A 144×144px circle with a teal border ring and mint-tinted fill. Inside: "73/100" rendered at large size, both parts blurred at `blur(10px)`. Label "Votre score global" below in readable text. The entire blurred zone has `select-none pointer-events-none aria-hidden` to prevent interaction and screen-reader confusion.

- [ ] **Step 1: Create src/components/paywall/GlobalScoreBlur.tsx**

```tsx
export function GlobalScoreBlur() {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
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
        {/* Blurred score */}
        <div
          className="flex items-baseline gap-0.5 select-none pointer-events-none"
          style={{ filter: "blur(10px)" }}
          aria-hidden
        >
          <span
            className="font-heading font-light text-5xl"
            style={{
              color: "oklch(0.42 0.128 168)",
              fontVariationSettings: '"SOFT" 100, "WONK" 0',
            }}
          >
            73
          </span>
          <span className="text-lg font-medium" style={{ color: "oklch(0.42 0.128 168)" }}>
            /100
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Votre score global</p>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/GlobalScoreBlur.tsx
git commit -m "feat(paywall): add GlobalScoreBlur component — blurred teal circle score"
```

---

## Task 2: DimensionsPreview — 5 compact gauge rows

**Files:**
- Create: `src/components/paywall/DimensionsPreview.tsx`

Server component. Five rows at fixed fills (68/72/65/70/67%). Each row is `flex items-center gap-2` with icon (14px), label (truncated at fixed width), thin gauge bar (h-1.5), and blurred fractional score at right. The blurred value uses `/20` notation (per spec). Total visual height: ~140px.

- [ ] **Step 1: Create src/components/paywall/DimensionsPreview.tsx**

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/DimensionsPreview.tsx
git commit -m "feat(paywall): add DimensionsPreview — 5 compact blurred gauge rows"
```

---

## Task 3: TrustBadges — condensed 3-icon trust strip

**Files:**
- Create: `src/components/paywall/TrustBadges.tsx`

Server component. Three inline items (icon + label text) on one row, wrapping on very narrow screens. Max total height ~50px. This replaces the full WhyNuroscape section.

- [ ] **Step 1: Create src/components/paywall/TrustBadges.tsx**

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/TrustBadges.tsx
git commit -m "feat(paywall): add TrustBadges — condensed 3-icon trust strip"
```

---

## Task 4: Update ReportContents — 2×2 on mobile, compact descriptions

**Files:**
- Modify: `src/components/paywall/ReportContents.tsx`

Two changes: (1) `grid-cols-1 sm:grid-cols-2` → `grid-cols-2` so mobile shows 2 columns. (2) Shorter descriptions and titles per spec. Also reduce card padding from `px-4 py-4` to `px-3 py-3` for compactness at 2-col mobile.

- [ ] **Step 1: Rewrite src/components/paywall/ReportContents.tsx**

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/ReportContents.tsx
git commit -m "fix(paywall): ReportContents — 2x2 mobile grid, compact descriptions"
```

---

## Task 5: Update FaqAccordion — shorter answers per spec

**Files:**
- Modify: `src/components/paywall/FaqAccordion.tsx`

Three answers need shortening to match the spec. Questions are unchanged. The `useState<number | null>(null)` initial state keeps all items closed on load — no change needed there.

Note on shadcn Accordion: the spec requests it but this project uses `@base-ui/react`, not Radix. The custom `useState` accordion is functionally identical (all closed by default, single-open behavior) and has zero extra dependencies.

- [ ] **Step 1: Update FAQS array in src/components/paywall/FaqAccordion.tsx**

Replace only the `FAQS` constant (lines 11–28). The rest of the file is unchanged.

```tsx
const FAQS: FaqItem[] = [
  {
    q: "Est-ce un diagnostic médical ?",
    a: "Non. Nuroscape propose une analyse de profil basée sur des questionnaires reconnus. Pour un diagnostic, consultez un professionnel de santé.",
  },
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
```

The full updated file (complete, for reference):

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/FaqAccordion.tsx
git commit -m "fix(paywall): FaqAccordion — shorter answers, tighter row padding"
```

---

## Task 6: Rewrite paywall/page.tsx + delete obsolete components

**Files:**
- Modify: `src/app/paywall/page.tsx`
- Delete: `src/components/paywall/ScorePreview.tsx`
- Delete: `src/components/paywall/WhyNuroscape.tsx`
- Delete: `src/components/paywall/HowItWorks.tsx`

Full rewrite of the page composition. Key changes from Phase 4.5.2 v1:
- Outer container: `space-y-10` → `space-y-6`, `max-w-lg` kept
- Import GlobalScoreBlur + DimensionsPreview instead of ScorePreview
- Import TrustBadges instead of WhyNuroscape
- Remove HowItWorks import entirely
- FakeReportPreview wrapper: add `max-h-[400px]` on inner div, gradient overlay is 180px tall (not full inset), lock badge anchored to bottom of overlay
- Remove `border-t border-border/20 pt-10` dividers (not in this spec)
- CTA #3 title: "Découvrez votre profil maintenant" (not "en 1 clic")

- [ ] **Step 1: Rewrite src/app/paywall/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { FakeReportPreview } from "@/components/paywall/FakeReportPreview";
import { GlobalScoreBlur } from "@/components/paywall/GlobalScoreBlur";
import { DimensionsPreview } from "@/components/paywall/DimensionsPreview";
import { ReportContents } from "@/components/paywall/ReportContents";
import { TrustBadges } from "@/components/paywall/TrustBadges";
import { FaqAccordion } from "@/components/paywall/FaqAccordion";
import { PricingCard } from "@/components/paywall/PricingCard";

export default async function PaywallPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;

  if (!session) redirect("/quiz");

  const supabase = await createAdminClient();
  const result = await supabase
    .from("assessments")
    .select("session_id")
    .eq("session_id", session)
    .maybeSingle();

  if (!result.data) redirect("/quiz");

  return (
    <div className="w-full max-w-lg space-y-6 pb-12">
      {/* ── 1. Hero ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-surface-mint rounded-2xl px-5 py-4">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
          >
            <CheckIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Votre profil a été analysé.
            </p>
            <p className="text-xs text-muted-foreground">
              Votre rapport personnalisé est prêt.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p
            className="font-heading font-light text-lg text-foreground tracking-[-0.015em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Votre rapport personnalisé comprend :
          </p>
          <ul className="space-y-1.5">
            {[
              "5 sections d'analyse approfondie",
              "Vos forces cognitives identifiées",
              "Vos patterns d'attention et d'énergie",
              "5 recommandations adaptées à vous",
              "3 prochaines étapes concrètes",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <span
                  className="text-xs font-semibold flex-shrink-0"
                  style={{ color: "oklch(0.42 0.128 168)" }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 2. Global score blurred ──────────────────────────────────── */}
      <GlobalScoreBlur />

      {/* ── 3. Dimensions preview ───────────────────────────────────── */}
      <DimensionsPreview />

      {/* ── 4. Fake blurred report preview (max-height 400px) ────────── */}
      <div className="relative rounded-2xl border border-border/40 overflow-hidden">
        <div className="max-h-[400px] overflow-hidden px-6 py-6">
          <FakeReportPreview />
        </div>
        {/* Gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-transparent to-background pointer-events-none" />
        {/* Lock badge over gradient */}
        <div className="absolute inset-x-0 bottom-5 flex justify-center">
          <div className="flex items-center gap-2.5 bg-background/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-border/40">
            <LockIcon />
            <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
          </div>
        </div>
      </div>

      {/* ── 5. CTA #1 ───────────────────────────────────────────────── */}
      <PricingCard sessionId={session} />

      {/* ── 6. What's in your report ────────────────────────────────── */}
      <ReportContents />

      {/* ── 7. CTA #2 ───────────────────────────────────────────────── */}
      <PricingCard sessionId={session} />

      {/* ── 8. Why Nuroscape (condensed) ────────────────────────────── */}
      <TrustBadges />

      {/* ── 9. FAQ ──────────────────────────────────────────────────── */}
      <FaqAccordion />

      {/* ── 10. CTA #3 final ────────────────────────────────────────── */}
      <PricingCard
        sessionId={session}
        title="Découvrez votre profil maintenant"
        showBottomStrip
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-foreground"
      aria-hidden
    >
      <path d="M2 7l3.5 3.5L12 3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-muted-foreground"
      aria-hidden
    >
      <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Delete obsolete components**

```bash
rm src/components/paywall/ScorePreview.tsx
rm src/components/paywall/WhyNuroscape.tsx
rm src/components/paywall/HowItWorks.tsx
```

- [ ] **Step 3: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Lint check**

```bash
npm run lint; echo "EXIT: $?"
```

Expected: `EXIT: 0`

- [ ] **Step 5: Commit**

```bash
git add src/app/paywall/page.tsx
git add -u src/components/paywall/ScorePreview.tsx src/components/paywall/WhyNuroscape.tsx src/components/paywall/HowItWorks.tsx
git commit -m "feat(paywall): Phase 4.5.2v2 — mobile-optimized layout

- GlobalScoreBlur + DimensionsPreview replace ScorePreview
- TrustBadges replaces WhyNuroscape (3-icon inline strip)
- HowItWorks removed for compactness
- FakeReportPreview capped at max-h-[400px] + gradient fade
- CTA #1 visible by ~1100px (well under 1500px target)
- Total page height ~2300px (under 3000px budget)
- space-y-6 throughout, no border-t dividers"
```

---

## Self-review

### Spec coverage

| Requirement | Task | Status |
|-------------|------|--------|
| Hero badge + checklist kept | 6 | ✓ inline in page.tsx |
| GlobalScoreBlur — blur(10px), "73"/100, teal ring, ~200px | 1 | ✓ |
| GlobalScoreBlur — user-select:none, pointer-events:none | 1 | ✓ `select-none pointer-events-none` |
| DimensionsPreview — 5 rows, fixed fills, blur(4px) on value | 2 | ✓ |
| DimensionsPreview — XX/20 notation | 2 | ✓ (14/20, 15/20, etc.) |
| DimensionsPreview — ~40-50px per row | 2 | ✓ (space-y-3, ~28px per row) |
| FakeReportPreview — max-height 400px | 6 | ✓ `max-h-[400px] overflow-hidden` |
| FakeReportPreview — gradient fade bottom 150px | 6 | ✓ `h-[180px] bg-gradient-to-b` |
| FakeReportPreview — "Rapport verrouillé" badge repositioned | 6 | ✓ absolute bottom-5 |
| CTA #1 visible before 1500px | 6 | ✓ appears at ~1012px |
| ReportContents — 2x2 mobile | 4 | ✓ `grid-cols-2` (no sm: prefix) |
| ReportContents — compact ~120px per card | 4 | ✓ `px-3 py-3`, smaller fonts |
| ReportContents — 4 specific cards with shorter descriptions | 4 | ✓ |
| CTA #2 — same teal card after ReportContents | 6 | ✓ `<PricingCard />` |
| TrustBadges — 3 micro inline, max 80px | 3 | ✓ flex-wrap, ~50px |
| TrustBadges placed under CTA #2 | 6 | ✓ |
| FAQ — 4 questions, all closed by default | 5 | ✓ `useState(null)` |
| FAQ — shorter answers per spec | 5 | ✓ |
| CTA #3 — title "Découvrez votre profil maintenant" | 6 | ✓ |
| CTA #3 — showBottomStrip (✓ Paiement · ✓ Sans engagement · ✓ RGPD) | 6 | ✓ |
| No "Comment ça marche" section | 6 | ✓ HowItWorks deleted |
| No testimonials | — | ✓ |
| Total page < 3000px | — | ✓ estimated ~2300px |
| CTA #1 < 1500px from top | — | ✓ ~1012px |
| blur components: filter + select-none + pointer-events-none | 1, 2 | ✓ all three applied |
| page.tsx stays server component | 6 | ✓ no "use client" |
| Only interactive components are client components | 5, FaqAccordion | ✓ |
| No new API calls | — | ✓ |
| No DB changes | — | ✓ |

### Placeholder scan

No TBD. All code blocks are complete. No "similar to Task N" references.

### Type consistency

- `GlobalScoreBlur` — named export, no props → matches import in Task 6 ✓
- `DimensionsPreview` — named export, no props → matches import in Task 6 ✓
- `TrustBadges` — named export, no props → matches import in Task 6 ✓
- `ReportContents` — named export, no props → matches import in Task 6 ✓
- `FaqAccordion` — named export, no props → matches import in Task 6 ✓
- `PricingCard` — `{ sessionId, title?, showBottomStrip? }` → used as `<PricingCard sessionId={session} />` (×2) and `<PricingCard sessionId={session} title="..." showBottomStrip />` (×1) ✓
