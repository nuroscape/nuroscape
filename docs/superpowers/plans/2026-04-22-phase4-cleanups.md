# Nuroscape Phase 4 — UI Fixes & Report Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the double wordmark on /paywall, suppress Base UI nativeButton warnings, and build the /dashboard/report/[id] full-report viewer.

**Architecture:** Three independent fixes (Tasks 1–2) then one new server-component page (Task 3). Tasks 1 and 2 touch only layout/component files; Task 3 adds a new route under the existing `(app)` auth-protected group, relying on RLS to scope data access.

**Tech Stack:** Next.js 16.2.4 App Router, @base-ui/react 1.4.0, Tailwind v4, Supabase (RLS), TypeScript strict.

---

## Pre-read — What is already done (no action needed)

- **Issue 3 — Réessayer button on /quiz/loading**: Already fixed. `src/app/quiz/loading/page.tsx` already uses `useCallback callApi` + `useRef calling` guard. The retry button correctly calls `callApi()` directly.
- **Issue 5 — /quiz/merci**: Page already exists at `src/app/quiz/merci/page.tsx` and calls `reset()` in a `useEffect`.

---

## Architectural decision — double wordmark on /paywall

The `/paywall` route renders **two** wordmarks because both `paywall/layout.tsx` and `paywall/page.tsx` render their own `<header>` with "nuroscape".

There are two possible fixes:

**Option A — Remove the outer shell from `paywall/page.tsx`**
The layout (`paywall/layout.tsx`) already provides the correct branded chrome (standalone wordmark, no global Navbar, no footer). The page's own `<div min-h-screen>` + `<header>` + `<main>` wrapper is a copy-paste artefact. Stripping it makes the page return only its content, which the layout wraps correctly. This is the idiomatic App Router pattern and keeps layout logic in exactly one place.

**Option B — Remove `paywall/layout.tsx` and let the page own its full shell**
Technically possible, but reverses the pattern: every future paywall sub-route would need to re-implement the same chrome. Also removes the `<title>` metadata that lives in the layout.

**→ Implement Option A.** The global `<Navbar>` is not involved (it only renders inside `(marketing)/layout.tsx`). There is nothing to hide — just remove the duplicate shell from the page.

---

## File Map

| File | Action |
|---|---|
| `src/app/paywall/layout.tsx` | Modify — change main to `justify-start py-8` |
| `src/app/paywall/page.tsx` | Modify — remove outer div/header/main shell |
| `src/components/ui/button.tsx` | Modify — auto-derive `nativeButton` from `render` prop |
| `src/app/(app)/dashboard/report/[id]/page.tsx` | Create — full report viewer |

---

## Task 1: Fix double wordmark on /paywall

**Files:**
- Modify: `src/app/paywall/layout.tsx`
- Modify: `src/app/paywall/page.tsx`

The root cause: `paywall/layout.tsx` wraps children in a `<main>` with `justify-center py-12`, while `paywall/page.tsx` also starts with `<div min-h-screen>` + `<header>nuroscape</header>` + `<main>`. Result: two wordmarks and a broken nested layout.

- [ ] **Step 1: Update `paywall/layout.tsx` — change main alignment**

Replace the current `<main>` className from `justify-center py-12` to `justify-start py-8` so the tall paywall content starts at the top on mobile rather than being vertically centered.

```tsx
// src/app/paywall/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Votre rapport est prêt | Nuroscape" };

export default function PaywallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-5 flex justify-center">
        <Link
          href="/"
          className="font-heading font-light text-lg tracking-[-0.01em] text-foreground"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          nuroscape
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update `paywall/page.tsx` — remove duplicate outer shell**

The page currently returns a `<div min-h-screen>` containing a `<header>` and an inner `<main>`. Remove all of that outer wrapping. Return only the `<div className="w-full max-w-md space-y-6">` and its children. Keep all inner content (status banner, locked report preview, pricing card) identical.

```tsx
// src/app/paywall/page.tsx
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ReportJSON } from "@/lib/openai/generate-report";
import { CheckoutButton } from "./checkout-button";

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
    .select("*")
    .eq("session_id", session)
    .maybeSingle();

  const assessment = result.data as Tables<"assessments"> | null;
  if (!assessment) redirect("/quiz");

  const report = assessment.report as (ReportJSON & { disclaimer?: string }) | null;

  const sectionTitles: string[] =
    report?.sections?.slice(0, 5).map((s) => s.title) ?? [
      "Votre profil d'inattention",
      "Votre profil d'hyperactivité et impulsivité",
      "Régulation émotionnelle",
      "Recommandations personnalisées",
      "Prochaines étapes concrètes",
    ];

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Status banner */}
      <div className="flex items-center gap-3 bg-surface-mint rounded-2xl px-5 py-4">
        <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <CheckIcon />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Analyse complète</p>
          <p className="text-xs text-muted-foreground">Vos réponses ont été analysées</p>
        </div>
      </div>

      {/* Locked report preview */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40">
          <h1
            className="font-heading font-light text-2xl text-foreground tracking-[-0.015em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Votre rapport est prêt.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Débloquez-le pour accéder à votre analyse complète.
          </p>
        </div>

        <div className="px-6 py-5 space-y-3 relative">
          <div className="space-y-2.5 blur-[3px] pointer-events-none select-none" aria-hidden>
            {sectionTitles.map((title) => (
              <div key={title} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">{title}</span>
                <span className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
                  Prêt
                </span>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-2.5 shadow-sm border border-border/40">
              <LockIcon />
              <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing card */}
      <div
        className="rounded-2xl p-6 text-primary-foreground"
        style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
      >
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

        <CheckoutButton sessionId={session} />

        <div className="flex justify-center gap-5 mt-5">
          {["Paiement sécurisé", "Sans engagement", "Données protégées"].map((item) => (
            <span key={item} className="text-[11px] text-primary-foreground/50">
              ✓ {item}
            </span>
          ))}
        </div>
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

- [ ] **Step 3: Verify in browser**

Navigate to `/paywall?session=<any-uuid>` (even a fake one will show 1 wordmark before the redirect fires). The header must show exactly **one** "nuroscape" wordmark.

Also verify that navigating to `/paywall` without a session correctly redirects to `/quiz`.

- [ ] **Step 4: Type-check**

```bash
cd /Users/oscarkalil/nuroscape && npm run build 2>&1 | head -40
```

Expected: no TypeScript errors in `paywall/page.tsx` or `paywall/layout.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/app/paywall/layout.tsx src/app/paywall/page.tsx
git commit -m "fix: remove duplicate wordmark shell from paywall page — layout handles chrome"
```

---

## Task 2: Fix Base UI nativeButton warnings in Button component

**Files:**
- Modify: `src/components/ui/button.tsx`

**Root cause:** `@base-ui/react` v1.4.0 `Button` has a `nativeButton` prop (from `NativeButtonProps`) that defaults to `true`, meaning Base UI expects to render a `<button>` element. When callers pass `render={<Link href="..." />}`, the element becomes an `<a>` tag. Base UI detects the mismatch and logs a console warning. The fix is to set `nativeButton={false}` whenever a `render` prop is provided.

The cleanest solution is to update the `Button` wrapper component once, so all callsites (navbar.tsx, hero.tsx, dashboard/page.tsx, etc.) are fixed automatically without any changes to those files.

- [ ] **Step 1: Update `src/components/ui/button.tsx`**

Destructure `render` and `nativeButton` explicitly. Default `nativeButton` to `false` when `render` is provided, `true` otherwise. The caller can still override explicitly.

```tsx
// src/components/ui/button.tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton = render == null,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      nativeButton={nativeButton}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

- [ ] **Step 2: Verify warnings are gone**

Start the dev server and open the browser console at `/` (marketing page with Navbar + Hero). Confirm no `nativeButton` warnings appear. Also check `/dashboard` (uses `<Button render={<Link />}>`).

```bash
npm run dev
```

Then open `http://localhost:3000` and `http://localhost:3000/dashboard` in browser. Browser console must show 0 `nativeButton` warnings.

- [ ] **Step 3: Type-check**

```bash
npm run build 2>&1 | head -40
```

Expected: no TypeScript errors (the `nativeButton` prop is typed in `ButtonPrimitive.Props` via `NativeButtonProps`).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "fix: auto-derive nativeButton=false when render prop is passed to Button"
```

---

## Task 3: Create /dashboard/report/[id] — full report viewer

**Files:**
- Create: `src/app/(app)/dashboard/report/[id]/page.tsx`

**Context:**
- Route group `(app)` handles auth via `src/app/(app)/layout.tsx` — it calls `createClient()`, checks user, redirects to `/login` if not authenticated. No additional auth check needed in the page.
- `(app)/layout.tsx` wraps children in `<main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">`. The page must only return its inner content.
- Supabase RLS policy on `assessments` is `FOR SELECT USING (auth.uid() = user_id)`. The regular `createClient()` (cookie-based session) will automatically scope the query to the authenticated user's rows — no need to pass `user_id` in the query condition.
- `params` is `Promise<{ id: string }>` in Next.js 16.
- `ReportJSON` is imported from `@/lib/openai/generate-report` and has: `{ intro, sections[{title,content}], strengths:{title,items[]}, recommendations:{title,items[]}, next_steps:{title,items[]} }`. The stored report also has `disclaimer?: string` added before insert.
- `scores` JSONB is `{ inattention: {raw,max,percent}, hyperactivity: {raw,max,percent}, global: {raw,max,percent} }`.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/oscarkalil/nuroscape/src/app/\(app\)/dashboard/report/\[id\]
```

- [ ] **Step 2: Write `src/app/(app)/dashboard/report/[id]/page.tsx`**

```tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ReportJSON } from "@/lib/openai/generate-report";

export const metadata: Metadata = { title: "Mon rapport TDAH" };

type ScoresJson = {
  inattention: { raw: number; max: number; percent: number };
  hyperactivity: { raw: number; max: number; percent: number };
  global: { raw: number; max: number; percent: number };
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const result = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const assessment = result.data as Tables<"assessments"> | null;
  if (!assessment) notFound();
  if (!assessment.paid) redirect(`/paywall?session=${assessment.session_id}`);

  const report = assessment.report as (ReportJSON & { disclaimer?: string }) | null;
  if (!report) notFound();

  const scores = assessment.scores as ScoresJson | null;
  const date = new Date(assessment.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8 pb-16 max-w-2xl">
      {/* Back + date */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <BackArrow />
          Tableau de bord
        </Link>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>

      {/* Page header */}
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary/80">
          Évaluation TDAH — Rapport personnel
        </p>
        <h1
          className="font-heading font-light text-[clamp(2rem,5vw,3rem)] leading-tight tracking-[-0.02em] text-foreground"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Votre rapport{" "}
          <em className="not-italic text-primary">sur-mesure</em>
        </h1>

        {scores && (
          <div className="flex flex-wrap gap-3 pt-1">
            <ScorePill label="Inattention" score={scores.inattention} />
            <ScorePill label="Hyperactivité" score={scores.hyperactivity} />
            <ScorePill label="Score global" score={scores.global} highlight />
          </div>
        )}
      </div>

      {/* Intro */}
      {report.intro && (
        <div className="bg-card rounded-2xl border border-border/60 p-6 sm:p-8">
          <p className="text-base text-foreground leading-relaxed">{report.intro}</p>
        </div>
      )}

      {/* Sections */}
      {Array.isArray(report.sections) && report.sections.length > 0 && (
        <div className="space-y-4">
          {report.sections.map((section, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/60 p-6 sm:p-8">
              <h2
                className="font-heading font-medium text-lg text-foreground mb-3 leading-snug"
                style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
              >
                {section.title}
              </h2>
              <p className="text-sm text-foreground/85 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Strengths — surface-mint bg */}
      {report.strengths?.items?.length > 0 && (
        <div className="rounded-2xl bg-surface-mint border border-border/40 p-6 sm:p-8">
          <h2
            className="font-heading font-medium text-lg text-foreground mb-4"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {report.strengths.title}
          </h2>
          <ul className="space-y-3">
            {report.strengths.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/85">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations — teal bg */}
      {report.recommendations?.items?.length > 0 && (
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
        >
          <h2
            className="font-heading font-medium text-lg text-primary-foreground mb-4"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {report.recommendations.title}
          </h2>
          <ul className="space-y-3">
            {report.recommendations.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-primary-foreground/85">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px] font-medium text-primary-foreground">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {report.next_steps?.items?.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 p-6 sm:p-8">
          <h2
            className="font-heading font-medium text-lg text-foreground mb-4"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            {report.next_steps.title}
          </h2>
          <ul className="space-y-3">
            {report.next_steps.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/85">
                <span className="mt-0.5 text-primary flex-shrink-0 font-medium">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      {report.disclaimer && (
        <div className="rounded-xl border border-border/40 bg-muted/40 p-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="font-medium text-foreground/70">Avertissement · </strong>
            {report.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

function ScorePill({
  label,
  score,
  highlight = false,
}: {
  label: string;
  score: { raw: number; max: number; percent: number };
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-full px-4 py-1.5 text-sm font-medium ${
        highlight
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground"
      }`}
    >
      {label} : {score.raw}/{score.max}
    </div>
  );
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 12L6 8l4-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

- [ ] **Step 3: Verify `report-card.tsx` link target**

Open `src/components/dashboard/report-card.tsx` and confirm the link points to `/dashboard/report/${assessment.id}` (with `assessment.id`, not `session_id`). This matches the new page's `params.id`.

Current line (should already be correct):
```tsx
href={`/dashboard/report/${assessment.id}`}
```

No change needed if it matches.

- [ ] **Step 4: Type-check**

```bash
npm run build 2>&1 | head -60
```

Expected: no TypeScript errors. Common pitfalls:
- `params` must be `Promise<{ id: string }>` — not destructured directly
- `result.data` cast to `Tables<"assessments"> | null` is required (CLAUDE.md convention)
- `report.strengths?.items?.length > 0` — the optional chaining is needed because the JSONB might be malformed

- [ ] **Step 5: Verify flow end-to-end**

Requires a paid assessment in the DB (either real or manually set `paid=true` in Supabase Dashboard).

1. Log in to the app (go to `/login`)
2. Go to `/dashboard` — click "Lire le rapport complet →" on a paid assessment card
3. Verify the report page loads with: back link, date, score pills, intro, 6 sections, strengths, recommendations, next steps, disclaimer
4. Manually visit `/dashboard/report/<id-of-another-users-assessment>` — must return 404 (RLS blocks it)
5. Manually visit `/dashboard/report/<id-of-unpaid-assessment>` — must redirect to `/paywall?session=<session_id>`

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/dashboard/report/[id]/page.tsx"
git commit -m "feat: add /dashboard/report/[id] full report viewer with score pills and section layout"
```

---

## Task 3a: Extract ScoresJson type (DRY fix — run before Task 3)

**Files:**
- Modify: `src/data/questions.ts`
- Modify: `src/components/dashboard/report-card.tsx`

- [ ] **Step 1: Add `ScoresJson` export to `src/data/questions.ts`**

Add this line immediately after the `ScoresWithContext` type definition (after line 40):

```ts
export type ScoresJson = ScoresWithContext["scores"];
```

This is an alias for the existing nested type — zero duplication, always in sync.

- [ ] **Step 2: Update `src/components/dashboard/report-card.tsx`**

Replace the local `ScoresJson` definition:

```ts
// Remove this:
type ScoresJson = {
  inattention: { raw: number; max: number; percent: number };
  hyperactivity: { raw: number; max: number; percent: number };
  global: { raw: number; max: number; percent: number };
};

// Replace with this import at the top of the file:
import type { ScoresJson } from "@/data/questions";
```

- [ ] **Step 3: Type-check**

```bash
npm run build 2>&1 | head -40
```

Expected: no TypeScript errors. The `ScoresJson` type from `questions.ts` is a superset (has all 5 categories + global) — structural typing means existing usages of `.inattention`, `.hyperactivity`, `.global` remain valid.

- [ ] **Step 4: Commit**

```bash
git add src/data/questions.ts src/components/dashboard/report-card.tsx
git commit -m "refactor: extract ScoresJson type to data/questions.ts, eliminate duplication"
```

---

## Task 4: Add branded 404 page

**Files:**
- Create: `src/app/not-found.tsx`

When `notFound()` is called anywhere in the app (unknown report ID, RLS-blocked assessment), Next.js renders the nearest `not-found.tsx`. Without one, it shows a generic unstyled page.

- [ ] **Step 1: Create `src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center space-y-5 max-w-sm">
        <p
          className="font-heading font-light text-[6rem] leading-none text-primary/20 select-none"
          aria-hidden
          style={{ fontVariationSettings: '"SOFT" 0, "WONK" 0' }}
        >
          404
        </p>
        <div className="space-y-2">
          <h1
            className="font-heading font-light text-2xl text-foreground tracking-[-0.02em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Page introuvable.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette page n&apos;existe pas ou vous n&apos;avez pas accès à ce contenu.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify manually**

Navigate to `/dashboard/report/00000000-0000-0000-0000-000000000000` (fake UUID) while logged in. Must show the branded 404, not the generic Next.js default.

- [ ] **Step 4: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: add branded 404 page for notFound() calls across the app"
```

---

## Task 5: Add error boundary for /dashboard

**Files:**
- Create: `src/app/(app)/dashboard/error.tsx`

If a Supabase query throws (network timeout, cold start) in a server component under `/dashboard`, Next.js propagates the exception. Without an `error.tsx`, users see the generic unbranded error page.

- [ ] **Step 1: Create `src/app/(app)/dashboard/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="space-y-2">
        <p className="font-heading text-lg font-medium text-foreground">
          Une erreur s&apos;est produite.
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Impossible de charger cette page. Vos données sont intactes.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -20
```

Expected: no errors. Note: `error.tsx` must be a Client Component (`"use client"`) — this is correct.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/dashboard/error.tsx"
git commit -m "feat: add error boundary for /dashboard to handle Supabase query failures"
```

---

## Updated File Map (after eng review)

| File | Action |
|---|---|
| `src/app/paywall/layout.tsx` | Modify — change main to `justify-start py-8` |
| `src/app/paywall/page.tsx` | Modify — remove outer div/header/main shell |
| `src/components/ui/button.tsx` | Modify — auto-derive `nativeButton` from `render` prop |
| `src/data/questions.ts` | Modify — export `ScoresJson` type alias |
| `src/components/dashboard/report-card.tsx` | Modify — import `ScoresJson` from data/questions |
| `src/app/(app)/dashboard/report/[id]/page.tsx` | Create — full report viewer |
| `src/app/not-found.tsx` | Create — branded 404 page |
| `src/app/(app)/dashboard/error.tsx` | Create — error boundary for dashboard |

**Implementation order:** Task 1 → Task 2 → Task 3a → Task 3 → Task 4 → Task 5 (or parallelize 1+2+4+5, then 3a→3)

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 4 issues, 1 critical gap resolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**VERDICT:** ENG CLEARED — ready to implement.

---

## Self-Review (updated after eng review)
