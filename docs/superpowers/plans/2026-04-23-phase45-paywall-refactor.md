# Phase 4.5 — Paywall Flow Refactor (OpenAI post-payment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move OpenAI report generation from pre-paywall to post-payment (webhook-triggered), reducing OpenAI costs by ~95% while maintaining conversion with a convincing static blurred preview.

**Architecture:** `/quiz/loading` now calls a cheap new endpoint (`/api/create-pending-assessment`) that inserts an assessment row with `report=null, paid=false` — no OpenAI. The paywall shows a static `FakeReportPreview` component (no real data needed). After Stripe `checkout.session.completed`, the existing webhook calls the refactored `/api/generate-report` (now guarded by `x-internal-secret` header, accepts `session_id`, UPDATEs instead of INSERTs). The dashboard report page handles the `paid=true, report=null` intermediate state with an auto-refreshing pending view.

**Tech Stack:** Next.js 16.2.4 App Router, TypeScript strict, Supabase (admin client), OpenAI gpt-4o-mini, Stripe webhooks, Tailwind v4.

---

## Pre-flight: Schema check

No DB migration needed. `assessments.report` is already `Json | null` in `src/types/database.ts` (line 46) and the Supabase schema. `paid` defaults to `false`. Confirm by reading `src/types/database.ts` — the `Insert` type has `report?: Json | null` and `paid?: boolean`.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/env.ts` | Modify | Add `INTERNAL_API_SECRET` server var |
| `src/app/api/create-pending-assessment/route.ts` | Create | New route: score calc + DB insert, no OpenAI |
| `src/app/api/generate-report/route.ts` | Modify | Accept `session_id` + internal secret header; fetch + UPDATE instead of INSERT |
| `src/app/quiz/loading/page.tsx` | Modify | Swap endpoint URL; reduce animation 5.2s → 3s |
| `src/components/paywall/FakeReportPreview.tsx` | Create | Static blurred 5-section report preview |
| `src/app/paywall/page.tsx` | Modify | Remove real data fetching; use FakeReportPreview; new wording + CTA |
| `src/app/api/webhooks/stripe/route.ts` | Modify | Call generate-report after marking paid=true |
| `src/app/(app)/dashboard/report/[id]/auto-refresh.tsx` | Create | Client component: auto-reload every 5s |
| `src/app/(app)/dashboard/report/[id]/page.tsx` | Modify | Handle paid=true + report=null with pending view |

---

## Task 1: Add INTERNAL_API_SECRET env var

**Files:**
- Modify: `src/env.ts`

The Stripe webhook needs to call `/api/generate-report` server-to-server. This secret proves the call is internal. Min 32 chars enforced by Zod so a weak value fails at startup.

- [ ] **Step 1: Edit src/env.ts**

Add `INTERNAL_API_SECRET: z.string().min(32)` to the `server` block and `INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET` to the `runtimeEnv` block.

Full file after edit:

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_TRIAL_PRICE_ID: z.string().min(1),
    STRIPE_MONTHLY_PRICE_ID: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email().default("noreply@nuroscape.fr"),
    INTERNAL_API_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_TRIAL_PRICE_ID: process.env.STRIPE_TRIAL_PRICE_ID,
    STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

- [ ] **Step 2: Generate the secret and add it to .env.local**

Run:
```bash
openssl rand -hex 32
```

Copy the 64-char output. Add this line to `.env.local`:
```
INTERNAL_API_SECRET=<paste here>
```

Also add to Vercel: Settings → Environment Variables → add `INTERNAL_API_SECRET` for Production + Preview.

- [ ] **Step 3: Verify build still passes with SKIP_ENV_VALIDATION**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/env.ts
git commit -m "feat(env): add INTERNAL_API_SECRET for internal API auth (min 32 chars)"
```

---

## Task 2: Create /api/create-pending-assessment

**Files:**
- Create: `src/app/api/create-pending-assessment/route.ts`

This replaces the role of `/api/generate-report` in the loading page. It validates quiz responses, computes scores (same `computeScoresWithContext` call), inserts the assessment with `report=null`, and returns `session_id`. No OpenAI. Response time: ~50ms vs ~5000ms. Cost: $0.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/api/create-pending-assessment
```

Create `src/app/api/create-pending-assessment/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { computeScoresWithContext } from "@/data/questions";

const isDev = process.env.NODE_ENV === "development";

// In-memory rate limit: 3 requests per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  let body: { responses?: Record<string, number> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const responses = body.responses ?? {};

  if (Object.keys(responses).length === 0) {
    return NextResponse.json({ error: "Réponses manquantes" }, { status: 400 });
  }

  const ctx = computeScoresWithContext(responses);

  let data: { session_id: string } | null = null;
  try {
    const supabase = await createAdminClient();
    const result = await supabase
      .from("assessments")
      .insert({
        responses,
        scores: ctx.scores,
        report: null,
        paid: false,
      })
      .select("session_id")
      .single();

    if (result.error || !result.data) {
      throw new Error(result.error?.message ?? "No data returned");
    }
    data = result.data as { session_id: string };
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      {
        error: "Erreur base de données",
        ...(isDev && { detail: err.message }),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ session_id: data.session_id });
}
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/create-pending-assessment/route.ts
git commit -m "feat(api): add create-pending-assessment route (scores + DB insert, no OpenAI)"
```

---

## Task 3: Refactor /api/generate-report

**Files:**
- Modify: `src/app/api/generate-report/route.ts`

New contract:
- Input: `{ session_id: string }` + `x-internal-secret` header
- Auth: reject 401 if header doesn't match `process.env.INTERNAL_API_SECRET`
- Fetches assessment from DB by session_id
- Calls OpenAI with existing `generateReport(ctx)`
- UPDATEs `assessments.report` (not INSERT)
- Idempotent: if `assessment.report !== null`, returns `{ ok: true, already_generated: true }` — safe on Stripe webhook retries

- [ ] **Step 1: Replace the entire file content**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateReport, DISCLAIMER } from "@/lib/openai/generate-report";
import { computeScoresWithContext } from "@/data/questions";
import type { Tables } from "@/types/database";

const isDev = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  // Internal-only: callable from Stripe webhook server-to-server
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { session_id } = body;
  if (!session_id) {
    return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const fetchResult = await supabase
    .from("assessments")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle();

  const assessment = fetchResult.data as Tables<"assessments"> | null;
  if (!assessment) {
    return NextResponse.json({ error: "Assessment non trouvé" }, { status: 404 });
  }

  // Idempotent: safe on Stripe webhook retries
  if (assessment.report !== null) {
    return NextResponse.json({ ok: true, already_generated: true });
  }

  const responses = assessment.responses as Record<string, number>;
  const ctx = computeScoresWithContext(responses);

  let report;
  try {
    report = await generateReport(ctx);
  } catch (e) {
    const err = e as Error;
    console.error("[generate-report] OpenAI error:", err.message);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du rapport",
        ...(isDev && { detail: err.message }),
      },
      { status: 500 }
    );
  }

  const reportWithDisclaimer = { ...report, disclaimer: DISCLAIMER };

  const updateResult = await supabase
    .from("assessments")
    .update({ report: reportWithDisclaimer })
    .eq("session_id", session_id);

  if (updateResult.error) {
    console.error("[generate-report] Supabase update error:", updateResult.error.message);
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  console.log("[generate-report] Report generated for session:", session_id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate-report/route.ts
git commit -m "refactor(api): generate-report accepts session_id + x-internal-secret, updates instead of inserts"
```

---

## Task 4: Update /quiz/loading — swap endpoint + reduce animation

**Files:**
- Modify: `src/app/quiz/loading/page.tsx`

Two targeted edits only — nothing else changes:
1. Animation timings: 1800/3600/5200ms → 1000/2000/3000ms
2. fetch URL: `/api/generate-report` → `/api/create-pending-assessment`

The request body `{ responses }` and response shape `{ session_id?, error? }` are identical — no other changes needed.

- [ ] **Step 1: Edit animation timeouts**

In `src/app/quiz/loading/page.tsx`, locate the step animation effect (around line 41):

```tsx
// Before:
const t1 = setTimeout(() => setStep(1), 1800);
const t2 = setTimeout(() => setStep(2), 3600);
const t3 = setTimeout(() => setAnimDone(true), 5200);

// After:
const t1 = setTimeout(() => setStep(1), 1000);
const t2 = setTimeout(() => setStep(2), 2000);
const t3 = setTimeout(() => setAnimDone(true), 3000);
```

- [ ] **Step 2: Edit the fetch URL**

Locate the `callApi` function (around line 58):

```tsx
// Before:
const res = await fetch("/api/generate-report", {

// After:
const res = await fetch("/api/create-pending-assessment", {
```

- [ ] **Step 3: Confirm no other changes needed**

Read `src/app/quiz/loading/page.tsx` top to bottom. Verify:
- The `responses` payload is the same (`body: JSON.stringify({ responses })`)
- The response parsing `data.session_id` is the same
- The redirect to `/paywall?session=${sessionId}` is unchanged

- [ ] **Step 4: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

- [ ] **Step 5: Commit**

```bash
git add src/app/quiz/loading/page.tsx
git commit -m "feat(quiz/loading): swap to create-pending-assessment, reduce animation to 3s"
```

---

## Task 5: Create FakeReportPreview component

**Files:**
- Create: `src/components/paywall/FakeReportPreview.tsx`

Static, no props, no interactivity. Five fixed sections, each with:
- A blurred title (Fraunces font, blur 4px)
- 2-3 blurred body paragraphs (blur 5px)
- A blurred bullet list of 3-4 items
- A blurred mint-background highlight box

Variable paragraph lengths to look like real content. `pointer-events-none select-none aria-hidden` so screen readers and users skip it.

- [ ] **Step 1: Create src/components/paywall/FakeReportPreview.tsx**

```tsx
const SECTIONS = [
  {
    title: "Votre profil d'attention",
    paragraphs: [
      "Votre capacité à maintenir l'attention sur des tâches répétitives ou peu stimulantes présente des variations notables selon les contextes. Ces fluctuations reflètent des mécanismes neurobiologiques spécifiques qui influencent votre quotidien professionnel et personnel de façon significative.",
      "Les environnements riches en distractions impactent de façon mesurable votre performance cognitive, notamment lors de tâches longues. Vos réponses indiquent des stratégies d'adaptation partiellement développées au fil des années.",
    ],
    bullets: [
      "Difficulté à maintenir l'attention sur des tâches longues",
      "Hyperfocalisation sur les sujets passionnants",
      "Sensibilité accrue aux distractions environnementales",
      "Tendance à perdre le fil dans les conversations complexes",
    ],
    highlight:
      "Votre profil d'attention révèle des forces importantes dans les situations de nouveauté et de défi cognitif élevé.",
  },
  {
    title: "Vos patterns d'hyperactivité et d'énergie",
    paragraphs: [
      "Votre niveau d'activation cognitive et physique montre des patterns caractéristiques qui se manifestent différemment selon les périodes de la journée et les types d'activités.",
      "Cette énergie, lorsqu'elle est bien canalisée, constitue un atout considérable dans les environnements stimulants. Vos réponses suggèrent une conscience croissante de vos cycles naturels d'activation.",
    ],
    bullets: [
      "Agitation interne même en apparence calme",
      "Recherche active de stimulation et de nouveauté",
      "Difficultés à déconnecter en fin de journée",
    ],
    highlight:
      "Les patterns identifiés sont cohérents avec un profil d'énergie atypique porteur d'un potentiel créatif significatif.",
  },
  {
    title: "Votre régulation émotionnelle",
    paragraphs: [
      "La gestion des émotions représente l'une des dimensions les moins connues du profil TDAH, pourtant centrale dans le vécu quotidien. Vos réponses éclairent des mécanismes de régulation émotionnelle spécifiques à votre profil personnel.",
    ],
    bullets: [
      "Intensité émotionnelle plus élevée que la moyenne",
      "Temps de récupération variable après une frustration",
      "Sensibilité au rejet ou à la critique perçue",
      "Enthousiasme intense pour les nouveaux projets",
    ],
    highlight:
      "Votre profil émotionnel inclut une empathie profonde et une sensibilité qui, dans les bons contextes, sont des atouts relationnels importants.",
  },
  {
    title: "Vos fonctions exécutives",
    paragraphs: [
      "Les fonctions exécutives — planification, inhibition, mémoire de travail — constituent le socle de l'organisation quotidienne. Les patterns observés dessinent un profil précis de vos forces et de vos défis organisationnels.",
      "Des stratégies de compensation ont visiblement été développées au fil du temps, témoignant d'une capacité d'adaptation remarquable face aux défis rencontrés dans ce domaine.",
    ],
    bullets: [
      "Démarrage difficile sur les tâches non urgentes",
      "Perception du temps subjective différente de l'horloge",
      "Mémoire de travail sollicitée de façon intensive",
    ],
    highlight:
      "Des compensations efficaces ont été développées qui masquent partiellement les difficultés — signe de résilience cognitive réelle.",
  },
  {
    title: "L'impact sur votre quotidien",
    paragraphs: [
      "L'évaluation de l'impact fonctionnel permet de comprendre comment ces patterns se traduisent concrètement dans votre vie professionnelle, relationnelle et personnelle.",
      "Les données de votre évaluation indiquent des zones d'impact spécifiques qui méritent une attention particulière et des stratégies d'adaptation ciblées sur vos besoins réels.",
    ],
    bullets: [
      "Impact professionnel sur la gestion des délais et priorités",
      "Relations personnelles : communication et incompréhensions",
      "Bien-être : fatigue liée à l'effort de compensation permanent",
      "Potentiel sous-exploité dans certains domaines clés",
    ],
    highlight:
      "L'impact identifié est réel mais modulable avec les bonnes stratégies adaptées à votre profil spécifique.",
  },
] as const;

export function FakeReportPreview() {
  return (
    <div className="space-y-8 pointer-events-none select-none" aria-hidden>
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-3">
          {/* Title */}
          <h3
            className="font-heading font-light text-xl text-foreground tracking-[-0.01em]"
            style={{
              fontVariationSettings: '"SOFT" 100, "WONK" 0',
              filter: "blur(4px)",
            }}
          >
            {section.title}
          </h3>

          {/* Body paragraphs */}
          <div className="space-y-2" style={{ filter: "blur(5px)" }}>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Bullet list */}
          <ul className="space-y-1.5" style={{ filter: "blur(5px)" }}>
            {section.bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/75">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
                />
                {item}
              </li>
            ))}
          </ul>

          {/* Highlight box */}
          <div
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "oklch(0.96 0.012 168)",
              filter: "blur(5px)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.08 168)" }}>
              {section.highlight}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/FakeReportPreview.tsx
git commit -m "feat(paywall): add FakeReportPreview with 5 blurred sections"
```

---

## Task 6: Refactor /paywall/page.tsx

**Files:**
- Modify: `src/app/paywall/page.tsx`

Remove: `ReportJSON` import, `sectionTitles` derivation, blurred section list, `LockIcon` overlay in its old form.
Add: new wording block ("Votre profil a été analysé" + checklist), `FakeReportPreview` under a gradient-fade + lock overlay, updated pricing sub-text.
Simplify: DB query fetches only `session_id` (no report data needed anymore).

The gradient overlay fades from transparent at the top to the page background (`--color-background`) at the bottom, with the lock badge anchored at the bottom of the preview card.

- [ ] **Step 1: Replace src/app/paywall/page.tsx entirely**

```tsx
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { CheckoutButton } from "./checkout-button";
import { FakeReportPreview } from "@/components/paywall/FakeReportPreview";

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
    <div className="w-full max-w-md space-y-8">
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

      {/* What's included */}
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

      {/* Fake blurred preview with gradient overlay */}
      <div className="relative rounded-2xl border border-border/40 overflow-hidden px-6 py-6">
        <FakeReportPreview />

        {/* Gradient fade from transparent to background + lock badge */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent via-background/60 to-background pb-6 items-center">
          <div className="flex items-center gap-2.5 bg-background/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-border/40">
            <LockIcon />
            <span className="text-sm font-medium text-foreground">Rapport verrouillé</span>
          </div>
        </div>
      </div>

      {/* Pricing + CTA */}
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
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/paywall/page.tsx
git commit -m "feat(paywall): FakeReportPreview + new wording, remove real report data dependency"
```

---

## Task 7: Update Stripe webhook to trigger report generation

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

After `assessments.update({ user_id, paid: true })`, call `/api/generate-report` with the internal secret. The call is awaited — if it fails, we log and continue (Stripe still gets `{ received: true }`). The generate-report route is **idempotent** (checks `assessment.report !== null`), so Stripe webhook retries are safe.

**Timeout note:** gpt-4o-mini typically responds in 3-8 seconds. Stripe allows ~30 seconds. We have enough budget. If this ever becomes a problem, move to a background job in Phase 5.

- [ ] **Step 1: Add the generate-report call inside checkout.session.completed**

In `src/app/api/webhooks/stripe/route.ts`, find the `checkout.session.completed` case. After the `assessments.update({ user_id, paid: true })` call and before the `subscriptions.upsert`, insert:

```typescript
// Trigger OpenAI report generation (idempotent — safe on webhook retries)
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
try {
  const reportRes = await fetch(`${appUrl}/api/generate-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!reportRes.ok) {
    console.error(
      "[webhook] generate-report failed:",
      reportRes.status,
      await reportRes.text()
    );
  }
} catch (e) {
  console.error("[webhook] generate-report fetch error:", (e as Error).message);
}
```

The full updated `checkout.session.completed` case becomes:

```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email;
  const sessionId = session.metadata?.session_id;

  if (!email || !sessionId) break;

  const createResult = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  let userId: string;

  if (createResult.error) {
    const existing = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!existing.data?.id) break;
    userId = existing.data.id as string;
  } else {
    userId = createResult.data.user.id;

    const linkResult = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });

    if (linkResult.data?.properties?.action_link) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: "Votre rapport Nuroscape est prêt",
        html: `
          <p style="font-family:sans-serif;color:#1c1e2a">Bonjour,</p>
          <p style="font-family:sans-serif;color:#1c1e2a">
            Votre rapport personnalisé est prêt. Cliquez sur le bouton ci-dessous
            pour y accéder — aucun mot de passe nécessaire.
          </p>
          <a
            href="${linkResult.data.properties.action_link}"
            style="display:inline-block;background:#1A7A65;color:#fff;font-family:sans-serif;
                   font-size:15px;padding:12px 28px;border-radius:999px;text-decoration:none;margin:16px 0"
          >
            Accéder à mon rapport
          </a>
          <p style="font-family:sans-serif;color:#737585;font-size:13px">
            Ce lien est valable 24 heures.
          </p>
        `,
      });
    }
  }

  // Mark assessment as paid and link to user
  await supabase
    .from("assessments")
    .update({ user_id: userId, paid: true })
    .eq("session_id", sessionId);

  // Trigger OpenAI report generation (idempotent — safe on webhook retries)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const reportRes = await fetch(`${appUrl}/api/generate-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!reportRes.ok) {
      console.error(
        "[webhook] generate-report failed:",
        reportRes.status,
        await reportRes.text()
      );
    }
  } catch (e) {
    console.error("[webhook] generate-report fetch error:", (e as Error).message);
  }

  // Upsert subscription
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    stripe_payment_intent_id: null,
    status: "trialing",
    plan: "trial",
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  break;
}
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(webhook): call generate-report after checkout.session.completed"
```

---

## Task 8: Handle paid=true + report=null in dashboard report page

**Files:**
- Create: `src/app/(app)/dashboard/report/[id]/auto-refresh.tsx`
- Modify: `src/app/(app)/dashboard/report/[id]/page.tsx`

When `paid=true` but `report=null` (OpenAI still running), show a pending view instead of 404. The pending view auto-reloads every 5 seconds via a client component (`AutoRefresh`) — this is a Server Component page so we can't call `useEffect` directly.

- [ ] **Step 1: Create auto-refresh.tsx**

Create `src/app/(app)/dashboard/report/[id]/auto-refresh.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export function AutoRefresh({ delayMs = 5000 }: { delayMs?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.reload(), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return null;
}
```

- [ ] **Step 2: Add ReportPendingView function to page.tsx**

In `src/app/(app)/dashboard/report/[id]/page.tsx`, add this import at the top (with the other imports):

```tsx
import { AutoRefresh } from "./auto-refresh";
```

Add this function before the `ScorePill` function at the bottom of the file:

```tsx
function ReportPendingView() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <AutoRefresh delayMs={5000} />
      <div className="flex flex-col items-center justify-center py-24 gap-8 text-center">
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              backgroundColor: "oklch(0.42 0.128 168 / 0.15)",
              animationDuration: "2s",
            }}
          />
          <div
            className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "oklch(0.42 0.128 168)" }}
          >
            <div className="w-2 h-2 rounded-full bg-white/80" />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <h1
            className="font-heading font-light text-2xl text-foreground tracking-[-0.015em]"
            style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
          >
            Votre rapport est en cours de génération.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette page se rafraîchit automatiquement. Cela prend généralement
            moins d&apos;une minute.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace the `if (!report) notFound()` guard**

In the `ReportPage` function body, locate (around line 44):

```tsx
// Before:
if (!report) notFound();

// After:
if (!report) {
  return <ReportPendingView />;
}
```

- [ ] **Step 4: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error|✓ Compiled"
```

- [ ] **Step 5: Lint check**

```bash
npm run lint
```

Expected: `EXIT: 0`

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/dashboard/report/[id]/auto-refresh.tsx \
        src/app/(app)/dashboard/report/[id]/page.tsx
git commit -m "feat(report): show auto-refreshing pending view when paid=true but report not yet generated"
```

---

## Self-review

### Spec coverage

| Requirement | Task | Covered? |
|-------------|------|----------|
| Remove OpenAI call from /quiz/loading | 4 | ✓ |
| Reduce animation to 3-4s | 4 | ✓ (3s exact) |
| POST create-pending-assessment | 2 + 4 | ✓ |
| Compute scores (computeScoresWithContext) | 2 | ✓ |
| Insert paid=false, report=null | 2 | ✓ |
| Return session_id | 2 | ✓ |
| Redirect to /paywall?session=xxx | unchanged in loading | ✓ |
| Remove score display from paywall | 6 | ✓ |
| Remove real section titles from paywall | 6 | ✓ |
| FakeReportPreview: 5 fixed sections | 5 | ✓ |
| FakeReportPreview: blurred paragraphs | 5 | ✓ (blur 5px) |
| FakeReportPreview: bullet lists per section | 5 | ✓ (3-4 items) |
| FakeReportPreview: highlight box per section | 5 | ✓ |
| New wording "Votre profil a été analysé" | 6 | ✓ |
| Checklist ✓ items | 6 | ✓ (5 items) |
| CTA "Accéder à mon rapport" | 6 | ✓ (CheckoutButton unchanged) |
| CTA sub-text pricing | 6 | ✓ |
| Jardin Lumineux design (Fraunces + oklch teal) | 5 + 6 | ✓ |
| Mobile-first (max-w-md) | 5 + 6 | ✓ |
| generate-report: internal auth only | 3 | ✓ (x-internal-secret) |
| generate-report: accepts session_id | 3 | ✓ |
| generate-report: fetch from DB + UPDATE | 3 | ✓ |
| generate-report: idempotent | 3 | ✓ (already_generated check) |
| create-pending-assessment rate limiting | 2 | ✓ (3/IP/10min) |
| create-pending-assessment: no OpenAI | 2 | ✓ |
| Webhook triggers generate-report | 7 | ✓ |
| report page: paid=true + report=null | 8 | ✓ (pending view + auto-refresh) |
| No DB schema changes | — | ✓ (report already Json\|null) |
| INTERNAL_API_SECRET env var | 1 | ✓ |
| /quiz/merci exists + resets Zustand | — | ✓ (already exists, no changes needed) |

### Type consistency

- Task 2 inserts `report: null` — matches `assessments.Insert.report?: Json | null` ✓
- Task 3 reads `assessment.responses as Record<string, number>` — same cast as old generate-report ✓
- Task 5 `FakeReportPreview` has no props — matches Task 6 usage `<FakeReportPreview />` ✓
- Task 8 `AutoRefresh` takes `{ delayMs?: number }` — matches Task 8 usage `<AutoRefresh delayMs={5000} />` ✓
- Task 7 sends `{ session_id: sessionId }` — matches Task 3 body type `{ session_id?: string }` ✓

### Placeholder scan

No TBD, no "implement later", no "add appropriate error handling" — all code is complete.
