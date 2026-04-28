# Phase 4.5.2 — Paywall Conversion Uplift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the minimal paywall into a full conversion page — curiosity + proof + reassurance — by adding 6 new sections while keeping the server component constraint and zero new API calls.

**Architecture:** Each new section is a standalone Server Component (pure display, no state), except `FaqAccordion` which is a client component. A reusable `PricingCard` server component wraps `CheckoutButton` and is rendered 3 times. `paywall/page.tsx` stays a server component and composes everything in order. No new routes, no new API calls, no DB changes.

**Tech Stack:** Next.js 16.2.4 App Router, TypeScript strict, Tailwind v4, lucide-react v1.8.0, existing Base UI `Button`.

---

## Pre-flight checks

- `src/components/paywall/FakeReportPreview.tsx` — exists ✓
- `src/app/paywall/checkout-button.tsx` — exists, client component ✓
- `lucide-react` icons needed: `Eye, Zap, Heart, Brain, Sun, Shield, Sparkles, Lock, Target, Compass, ChevronDown` — all confirmed present in v1.8.0 ✓
- No shadcn Accordion needed — FAQ implemented with `useState` (no Radix dependency)

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/paywall/ScorePreview.tsx` | Create | 5 gauge bars, static 65-70% fills, value blurred |
| `src/components/paywall/ReportContents.tsx` | Create | 4-card 2×2 grid with icons |
| `src/components/paywall/HowItWorks.tsx` | Create | 3-step numbered flow |
| `src/components/paywall/WhyNuroscape.tsx` | Create | 3 trust bullets with icons |
| `src/components/paywall/FaqAccordion.tsx` | Create | FAQ accordion, **client component** |
| `src/components/paywall/PricingCard.tsx` | Create | Reusable teal CTA card, accepts optional title + strip |
| `src/app/paywall/page.tsx` | Modify | Compose all sections in spec order; expand max-w-md → max-w-lg |

---

## Task 1: ScorePreview — 5 dimension gauge bars

**Files:**
- Create: `src/components/paywall/ScorePreview.tsx`

Static display component. Five horizontal gauges at fixed 65-70% widths — no real quiz data, no props. The numerical value is rendered in the DOM but blurred to 4px so it cannot be read. Icon + readable label on the left, blurred value on the right. Wrapped in a bordered card matching the existing FakeReportPreview aesthetic.

- [ ] **Step 1: Create src/components/paywall/ScorePreview.tsx**

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/ScorePreview.tsx
git commit -m "feat(paywall): add ScorePreview with 5 blurred dimension gauges"
```

---

## Task 2: ReportContents — 4-card grid

**Files:**
- Create: `src/components/paywall/ReportContents.tsx`

Four cards in a 1-col (mobile) / 2-col (sm+) grid. Each card has a tinted icon badge, a Fraunces heading, and a 1-2 sentence description in DM Sans. Mint-tinted background to match the design system.

- [ ] **Step 1: Create src/components/paywall/ReportContents.tsx**

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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/ReportContents.tsx
git commit -m "feat(paywall): add ReportContents 4-card grid"
```

---

## Task 3: HowItWorks — 3-step flow

**Files:**
- Create: `src/components/paywall/HowItWorks.tsx`

Three numbered steps: vertical stack on mobile, horizontal row on sm+. Number in a teal circle, title in medium weight, description in muted small text.

- [ ] **Step 1: Create src/components/paywall/HowItWorks.tsx**

```tsx
type Step = {
  n: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    n: "1",
    title: "Activez votre essai",
    description: "1,99€ pour 7 jours d'accès complet.",
  },
  {
    n: "2",
    title: "Accédez à votre rapport",
    description: "Généré en quelques secondes après activation.",
  },
  {
    n: "3",
    title: "Explorez et agissez",
    description: "Lisez, téléchargez, appliquez à votre rythme.",
  },
];

export function HowItWorks() {
  return (
    <div className="space-y-4">
      <p
        className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Comment ça marche
      </p>

      <div className="flex flex-col sm:flex-row gap-5">
        {STEPS.map(({ n, title, description }) => (
          <div key={n} className="flex-1 flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm text-primary-foreground font-medium"
              style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
            >
              {n}
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/HowItWorks.tsx
git commit -m "feat(paywall): add HowItWorks 3-step section"
```

---

## Task 4: WhyNuroscape — 3 trust bullets

**Files:**
- Create: `src/components/paywall/WhyNuroscape.tsx`

Three trust signals: Shield (clinical basis), Sparkles (AI personalization), Lock (RGPD). Same layout pattern as HowItWorks — vertical mobile, horizontal sm+.

- [ ] **Step 1: Create src/components/paywall/WhyNuroscape.tsx**

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/WhyNuroscape.tsx
git commit -m "feat(paywall): add WhyNuroscape trust bullets section"
```

---

## Task 5: FaqAccordion — FAQ with custom toggle

**Files:**
- Create: `src/components/paywall/FaqAccordion.tsx`

Client component (needs `useState` for expand/collapse). Simple custom accordion — no Radix, no Base UI Accordion dependency. One item open at a time. `aria-expanded` on the button for accessibility. ChevronDown icon rotates 180° when open via inline style transform.

- [ ] **Step 1: Create src/components/paywall/FaqAccordion.tsx**

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
    a: "Oui, à tout moment depuis votre espace personnel ou en 1 clic par email. Aucun engagement.",
  },
  {
    q: "Mes réponses sont-elles privées ?",
    a: "Oui. Vos données sont anonymes, chiffrées, hébergées en Europe. Elles ne sont jamais revendues.",
  },
  {
    q: "Combien de temps prend la lecture du rapport ?",
    a: "Environ 10-15 minutes. Le rapport est téléchargeable et disponible en permanence dans votre espace.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p
        className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
      >
        Questions fréquentes
      </p>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-border/50 rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
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
              <div className="px-5 pb-4 border-t border-border/30">
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
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/FaqAccordion.tsx
git commit -m "feat(paywall): add FaqAccordion client component"
```

---

## Task 6: PricingCard — reusable CTA card

**Files:**
- Create: `src/components/paywall/PricingCard.tsx`

Extracted from the current inline card in `paywall/page.tsx`. Accepts:
- `sessionId: string` — passed to CheckoutButton
- `title?: string` — when provided, renders a Fraunces heading above the price (CTA #3)
- `showBottomStrip?: boolean` — when true, renders the RGPD reassurance line below the card (CTA #3)

Default (no title, no strip) = CTA #1 and #2. With title + strip = CTA #3.

- [ ] **Step 1: Create src/components/paywall/PricingCard.tsx**

```tsx
import { CheckoutButton } from "@/app/paywall/checkout-button";

export function PricingCard({
  sessionId,
  title,
  showBottomStrip = false,
}: {
  sessionId: string;
  title?: string;
  showBottomStrip?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl p-6 text-primary-foreground"
        style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
      >
        {title && (
          <p
            className="font-heading font-light text-2xl tracking-[-0.015em] mb-5"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {title}
          </p>
        )}

        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-heading font-light text-4xl tracking-tight"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            1,99 €
          </span>
          <span className="text-primary-foreground/70 text-sm">/ 7 jours</span>
        </div>
        <p className="text-primary-foreground/65 text-sm mb-6">
          Puis 14,99 €/mois — résiliable à tout moment
        </p>

        <CheckoutButton sessionId={sessionId} />

        <p className="text-center text-[11px] text-primary-foreground/50 mt-3">
          Essai 7 jours · 1,99€ puis 14,99€/mois · Résiliable à tout moment
        </p>

        <div className="flex justify-center gap-5 mt-4">
          {["Paiement sécurisé", "Sans engagement", "Données protégées"].map((item) => (
            <span key={item} className="text-[11px] text-primary-foreground/50">
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {showBottomStrip && (
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          ✓ Paiement sécurisé Stripe · ✓ Sans engagement · ✓ Données RGPD
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/PricingCard.tsx
git commit -m "feat(paywall): add reusable PricingCard component"
```

---

## Task 7: Compose paywall/page.tsx

**Files:**
- Modify: `src/app/paywall/page.tsx`

Imports all 6 new components. Replaces the existing inline teal card with `<PricingCard>`. Expands the outer wrapper from `max-w-md` to `max-w-lg` (512px) for breathing room in the 2-col grids. Adds a subtle `border-t border-border/20` divider before each major section to improve visual rhythm. Local `CheckIcon` and `LockIcon` SVG functions remain (still used by hero banner and FakeReportPreview overlay).

The section order matches the spec exactly:
1. Hero (badge + checklist) — kept inline
2. `<ScorePreview />`
3. FakeReportPreview with gradient overlay — kept inline
4. `<PricingCard sessionId={session} />` — CTA #1
5. `<ReportContents />`
6. `<HowItWorks />`
7. `<WhyNuroscape />`
8. `<PricingCard sessionId={session} />` — CTA #2
9. `<FaqAccordion />`
10. `<PricingCard sessionId={session} title="Découvrez votre profil en 1 clic" showBottomStrip />` — CTA #3

- [ ] **Step 1: Replace src/app/paywall/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { FakeReportPreview } from "@/components/paywall/FakeReportPreview";
import { ScorePreview } from "@/components/paywall/ScorePreview";
import { ReportContents } from "@/components/paywall/ReportContents";
import { HowItWorks } from "@/components/paywall/HowItWorks";
import { WhyNuroscape } from "@/components/paywall/WhyNuroscape";
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
    <div className="w-full max-w-lg space-y-10 pb-16">
      {/* ── 1. Hero ─────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Status banner */}
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

        {/* What's included checklist */}
        <div className="space-y-3">
          <p
            className="font-heading font-light text-xl text-foreground tracking-[-0.015em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Votre rapport personnalisé comprend :
          </p>
          <ul className="space-y-2">
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

      {/* ── 2. Score preview ────────────────────────────────────────── */}
      <ScorePreview />

      {/* ── 3. Fake blurred report preview ──────────────────────────── */}
      <div className="relative rounded-2xl border border-border/40 overflow-hidden px-6 py-6">
        <FakeReportPreview />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent via-background/60 to-background pb-6 items-center">
          <div className="flex items-center gap-2.5 bg-background/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-border/40">
            <LockIcon />
            <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
          </div>
        </div>
      </div>

      {/* ── 4. CTA #1 ───────────────────────────────────────────────── */}
      <PricingCard sessionId={session} />

      {/* ── 5. What's in your report ────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <ReportContents />
      </div>

      {/* ── 6. How it works ─────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <HowItWorks />
      </div>

      {/* ── 7. Why Nuroscape ────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <WhyNuroscape />
      </div>

      {/* ── 8. CTA #2 ───────────────────────────────────────────────── */}
      <PricingCard sessionId={session} />

      {/* ── 9. FAQ ──────────────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <FaqAccordion />
      </div>

      {/* ── 10. CTA #3 final ────────────────────────────────────────── */}
      <div className="border-t border-border/20 pt-10">
        <PricingCard
          sessionId={session}
          title="Découvrez votre profil en 1 clic"
          showBottomStrip
        />
      </div>
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

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Lint check**

```bash
npm run lint; echo "EXIT: $?"
```

Expected: `EXIT: 0`

- [ ] **Step 4: Commit**

```bash
git add src/app/paywall/page.tsx
git commit -m "feat(paywall): compose full conversion page — ScorePreview, ReportContents, HowItWorks, WhyNuroscape, FaqAccordion, 3× PricingCard"
```

---

## Self-review

### Spec coverage

| Section | Task | Covered? |
|---------|------|----------|
| 1. Hero badge + checklist (keep) | 7 | ✓ kept inline |
| 2. ScorePreview 5 gauges | 1 | ✓ |
| ScorePreview: icon left of label | 1 | ✓ (Eye, Zap, Heart, Brain, Sun) |
| ScorePreview: value blurred (filter 4px) | 1 | ✓ |
| ScorePreview: fixed 65-70% fills | 1 | ✓ (68/72/65/70/67%) |
| 3. FakeReportPreview (keep) | 7 | ✓ kept inline |
| 4. CTA #1 teal card | 6+7 | ✓ `<PricingCard />` |
| 5. ReportContents 4-card 2×2 grid | 2 | ✓ |
| ReportContents: icons (Brain/Zap/Target/Compass) | 2 | ✓ |
| ReportContents: Fraunces title + DM Sans description | 2 | ✓ |
| 6. HowItWorks 3 steps | 3 | ✓ |
| HowItWorks: mobile stacked, sm+ horizontal | 3 | ✓ (flex-col sm:flex-row) |
| 7. WhyNuroscape 3 bullets | 4 | ✓ (Shield/Sparkles/Lock) |
| 8. CTA #2 identical to CTA #1 | 6+7 | ✓ `<PricingCard />` |
| 9. FAQ 4 questions accordion | 5 | ✓ |
| FAQ: single open at a time | 5 | ✓ (useState<number\|null>) |
| FAQ: aria-expanded on button | 5 | ✓ |
| 10. CTA #3 with title | 6+7 | ✓ `title="Découvrez votre profil en 1 clic"` |
| CTA #3: bottom RGPD strip | 6+7 | ✓ `showBottomStrip` |
| No fake testimonials | — | ✓ no testimonial section |
| Server component constraint (page.tsx) | 7 | ✓ |
| Only FaqAccordion is client component | 5 | ✓ |
| No new API calls | — | ✓ |
| No DB changes | — | ✓ |
| Design system (Fraunces + oklch teal) | all | ✓ |
| Mobile-first | all | ✓ (flex-col sm:flex-row, grid-cols-1 sm:grid-cols-2) |

### Placeholder scan

No TBD, no "implement later". All code is complete.

### Type consistency

- `DIMENSIONS` uses `LucideIcon` type for icon field — same pattern in `BULLETS` and `CARDS` ✓
- `PricingCard` props: `sessionId: string`, `title?: string`, `showBottomStrip?: boolean` — matches all 3 usages in Task 7 ✓
- `FaqAccordion` exports `FaqAccordion()` — matches import in Task 7 ✓
- All components are named exports — matches import style in Task 7 ✓
