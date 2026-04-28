# Phase 4.5.3 — Paywall Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the paywall inspection-proof — no real user data in the DOM, lorem ipsum behind blurs, medical disclaimer in footer — while removing the "diagnostic" FAQ entry and keeping 100% visual parity.

**Architecture:** Five targeted file edits. No new files, no new routes, no DB changes. `paywall/page.tsx` already only fetches `session_id` (`.select("session_id")`) — confirmed safe, no change needed to the DB query. The medical disclaimer moves from a FAQ answer to a permanent footer line in `page.tsx`. `GlobalScoreBlur` keeps "73" in the DOM (hardcoded, same for all users, never fetched from DB — see code comment for justification). `DimensionsPreview` changes display values to "XX/20" and corrects fill percentages per spec. `FakeReportPreview` gets a full lorem-ipsum content swap while keeping identical structure and blur values.

**Tech Stack:** Next.js 16.2.4 App Router, TypeScript strict, Tailwind v4.

---

## File map

| File | Action | What changes |
|------|--------|-------------|
| `src/components/paywall/FaqAccordion.tsx` | Modify | Remove Q1 ("Est-ce un diagnostic ?"), 3 items remain |
| `src/app/paywall/page.tsx` | Modify | Add medical disclaimer paragraph after CTA #3 |
| `src/components/paywall/GlobalScoreBlur.tsx` | Modify | Add justification comment; no data-leakage (73 is hardcoded) |
| `src/components/paywall/DimensionsPreview.tsx` | Modify | Fills → 68/52/74/61/58%; display values → "XX/20" |
| `src/components/paywall/FakeReportPreview.tsx` | Modify | Replace all paragraph/bullet/highlight text with lorem ipsum |

---

## Task 1: FaqAccordion — remove Q1 ("Est-ce un diagnostic médical ?")

**Files:**
- Modify: `src/components/paywall/FaqAccordion.tsx`

Remove the first FAQS entry entirely. The 3 remaining questions are: annuler, réponses privées, combien de temps. Array starts at the annulation question. No other changes to the component.

- [ ] **Step 1: Rewrite FAQS constant in src/components/paywall/FaqAccordion.tsx**

Replace the full file content:

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
git commit -m "fix(paywall): remove medical FAQ entry — 3 questions remain"
```

---

## Task 2: paywall/page.tsx — add medical disclaimer footer

**Files:**
- Modify: `src/app/paywall/page.tsx`

Add a single `<p>` tag after the final `<PricingCard ... showBottomStrip />`. The disclaimer replaces the removed FAQ entry as the legal protection. Style: `text-xs` (~12px), `italic`, `text-center`, `opacity-60`.

`page.tsx` data audit (already confirmed safe — no change to DB query):
```tsx
// This is the only DB call on this page — only session_id is fetched,
// zero user data (scores, responses, report) is sent to the client.
const result = await supabase
  .from("assessments")
  .select("session_id")   // ← session_id only, never scores or report
  .eq("session_id", session)
  .maybeSingle();
```

- [ ] **Step 1: Add disclaimer after CTA #3 in src/app/paywall/page.tsx**

Find the closing `</div>` of the outer wrapper (the last line before `);` in the JSX return) and insert the disclaimer paragraph before it. The `<PricingCard ... showBottomStrip />` already renders the RGPD/payment strip. The disclaimer goes directly after.

Replace the bottom of the JSX (from `{/* ── 10. CTA #3 final ── */}` to the closing `</div>`) with:

```tsx
      {/* ── 10. CTA #3 final ────────────────────────────────────────── */}
      <PricingCard
        sessionId={session}
        title="Découvrez votre profil maintenant"
        showBottomStrip
      />

      {/* ── Medical disclaimer ───────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground/60 italic text-center leading-relaxed px-2">
        Nuroscape n&apos;est pas un outil de diagnostic médical. Pour un diagnostic,
        consultez un professionnel de santé.
      </p>
    </div>
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/paywall/page.tsx
git commit -m "feat(paywall): add medical disclaimer footer — replaces removed FAQ entry"
```

---

## Task 3: GlobalScoreBlur — document safety, confirm no data leakage

**Files:**
- Modify: `src/components/paywall/GlobalScoreBlur.tsx`

**Decision rationale (in plan, repeated in code comment):** "73" stays in the DOM as a hardcoded constant. It is not the user's score. It is not fetched from DB. It is identical for every single user. Disabling CSS reveals "73" — which correctly implies "this is a placeholder, not your score." The pseudo-element approach (`::before` with `content:`) would require an inline `<style>` tag in JSX, which is non-standard in Tailwind v4 and creates maintenance overhead. The hardcoded approach is equally secure and simpler.

The one real change: add `aria-label` to the outer container so screen readers announce it correctly, and ensure the blurred div has `aria-hidden` (already does).

- [ ] **Step 1: Rewrite src/components/paywall/GlobalScoreBlur.tsx**

```tsx
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
         * from the DB, and identical for every single visitor.
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
            73
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
```

Note: `{ filter: "blur(10px)", WebkitUserDrag: "none" } as React.CSSProperties` — the cast is required because `WebkitUserDrag` is not in the standard `CSSProperties` type in older TS React definitions.

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/GlobalScoreBlur.tsx
git commit -m "fix(paywall): GlobalScoreBlur — document security posture, add aria-label"
```

---

## Task 4: DimensionsPreview — updated fills + display "XX/20"

**Files:**
- Modify: `src/components/paywall/DimensionsPreview.tsx`

Two changes:
1. Fill percentages updated to spec values: 68 / 52 / 74 / 61 / 58 (previously 68/72/65/70/67). These are fixed constants, same for all users, not derived from DB.
2. Display values changed from "14/20", "15/20", etc. → all become "XX/20". This ensures F12 inspection reveals "XX/20" — clearly placeholder, not real data.

`-webkit-user-drag: none` added to the blurred spans.

- [ ] **Step 1: Rewrite src/components/paywall/DimensionsPreview.tsx**

```tsx
import { Eye, Zap, Heart, Brain, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Dimension = {
  icon: LucideIcon;
  label: string;
  fill: number;
};

/*
 * SECURITY NOTE: fill values (68, 52, 74, 61, 58) are compile-time
 * constants — same for every user, never fetched from DB.
 * display value "XX/20" is intentionally opaque placeholder text.
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
```

- [ ] **Step 2: Build check**

```bash
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/paywall/DimensionsPreview.tsx
git commit -m "fix(paywall): DimensionsPreview — fill values per spec, display XX/20"
```

---

## Task 5: FakeReportPreview — replace content with lorem ipsum

**Files:**
- Modify: `src/components/paywall/FakeReportPreview.tsx`

Full content swap. The SECTIONS array structure (title, paragraphs, bullets, highlight) stays identical. The titles stay the same (they're generic dimension names, already blurred at 4px). All paragraph text, bullet items, and highlight text become lorem ipsum — varied in length to mimic realistic content density. Visual output (blur, layout, spacing) is completely unchanged.

**Why lorem ipsum and not empty strings:** Empty content would collapse the visual height, breaking the layout illusion. Lorem ipsum fills the same visual space as real text while being unambiguously placeholder content.

- [ ] **Step 1: Rewrite src/components/paywall/FakeReportPreview.tsx**

```tsx
const SECTIONS = [
  {
    title: "Votre profil d'attention",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.",
    ],
    bullets: [
      "Lorem ipsum dolor sit amet consectetur",
      "Adipiscing elit sed do eiusmod tempor",
      "Incididunt ut labore et dolore magna",
      "Aliqua ut enim ad minim veniam quis",
    ],
    highlight:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam quis nostrud.",
  },
  {
    title: "Vos patterns d'hyperactivité et d'énergie",
    paragraphs: [
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta.",
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    ],
    bullets: [
      "Neque porro quisquam est qui dolorem",
      "Ipsum quia dolor sit amet consectetur",
      "Adipisci velit sed quia non numquam",
    ],
    highlight:
      "Ut labore et dolore magnam aliquam quaerat voluptatem. Quis autem vel eum iure reprehenderit.",
  },
  {
    title: "Votre régulation émotionnelle",
    paragraphs: [
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    ],
    bullets: [
      "Similique sunt in culpa qui officia",
      "Deserunt mollitia animi id est laborum",
      "Et dolorum fuga et harum quidem rerum",
      "Facilis est et expedita distinctio nam",
    ],
    highlight:
      "Nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus.",
  },
  {
    title: "Vos fonctions exécutives",
    paragraphs: [
      "Temporibus autem quibusdam et aut officiis debitis rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint molestiae non recusandae.",
      "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
    ],
    bullets: [
      "Quis autem vel eum iure reprehenderit",
      "Qui in ea voluptate velit esse quam",
      "Nihil molestiae consequatur vel illum",
    ],
    highlight:
      "Quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi.",
  },
  {
    title: "L'impact sur votre quotidien",
    paragraphs: [
      "Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit.",
      "Esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus blanditiis praesentium.",
    ],
    bullets: [
      "Voluptatum deleniti atque corrupti quos",
      "Dolores et quas molestias excepturi sint",
      "Occaecati cupiditate non provident similique",
      "Sunt in culpa qui officia deserunt mollitia",
    ],
    highlight:
      "Animi id est laborum et dolorum fuga et harum quidem rerum facilis est et expedita distinctio.",
  },
] as const;

export function FakeReportPreview() {
  return (
    <div className="space-y-8 pointer-events-none select-none" aria-hidden>
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3
            className="font-heading font-light text-xl text-foreground tracking-[-0.01em]"
            style={{
              fontVariationSettings: '"SOFT" 100, "WONK" 0',
              filter: "blur(4px)",
            }}
          >
            {section.title}
          </h3>

          <div className="space-y-2" style={{ filter: "blur(5px)" }}>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

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
SKIP_ENV_VALIDATION=1 npm run build 2>&1 | grep -E "error TS|Error:|✓ Compiled|Failed to compile"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Lint check**

```bash
npm run lint; echo "EXIT: $?"
```

Expected: `EXIT: 0`

- [ ] **Step 4: Commit**

```bash
git add src/components/paywall/FakeReportPreview.tsx
git commit -m "fix(paywall): FakeReportPreview — lorem ipsum content, no real data visible"
```

---

## Task 6: Final verification

Manual checks to run after all tasks complete. These cannot be automated without a browser testing setup.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to paywall with a valid session**

Open `http://localhost:3000/paywall?session=<any-valid-session-id>` — grab a session ID from Supabase dashboard or run a quiz locally.

- [ ] **Step 3: F12 → Elements — search for numeric scores**

In the Elements panel, use Ctrl+F to search for:
- `"73"` → should appear once in GlobalScoreBlur (expected, hardcoded placeholder)
- `"15"`, `"14"`, `"13"` → should NOT appear anywhere (DimensionsPreview now uses "XX/20")
- `"XX/20"` → should appear 5 times in DimensionsPreview
- Any text matching real French assessment content (e.g., "neurobiologique", "hyperfocalisation") → should NOT appear

- [ ] **Step 4: F12 → Network tab**

Reload the page with Network tab open. Verify:
- No request to `/api/generate-report`
- No request fetching assessment data
- The only DB call is the session validation (visible in server logs only, not Network tab since it's a server component)

- [ ] **Step 5: F12 → Disable CSS filter on FakeReportPreview**

In Elements panel, find the `FakeReportPreview` root div (`pointer-events-none select-none`). Remove `filter: blur(5px)` from a blurred child. Verify the revealed text is lorem ipsum (e.g., "Lorem ipsum dolor sit amet"), not French ADHD assessment content.

- [ ] **Step 6: Check FAQ has 3 items (not 4)**

On the paywall, expand the FAQ section. Verify 3 accordion rows visible: "Puis-je annuler…", "Mes réponses sont-elles privées…", "Combien de temps prend la lecture…"

- [ ] **Step 7: Check disclaimer visible**

Scroll to bottom of paywall. Verify small italic disclaimer text: "Nuroscape n'est pas un outil de diagnostic médical. Pour un diagnostic, consultez un professionnel de santé."

- [ ] **Step 8: Final lint**

```bash
npm run lint; echo "EXIT: $?"
```

Expected: `EXIT: 0`

- [ ] **Step 9: Commit verification**

```bash
git log --oneline -6
```

Expected: 6 commits since Phase 4.5.2v2 (tasks 1-5 + this verification commit if needed).

---

## Self-review

### Spec coverage

| Requirement | Task | Status |
|-------------|------|--------|
| Remove Q1 "diagnostic médical" from FAQ | 1 | ✓ |
| FAQ has 3 questions | 1 | ✓ (annuler, privées, combien) |
| Medical disclaimer in paywall footer | 2 | ✓ after CTA #3, italic, text-xs, muted |
| GlobalScoreBlur: no real user data in DOM | 3 | ✓ "73" is hardcoded constant, justified in comment |
| GlobalScoreBlur: select-none + pointer-events-none | 3 | ✓ (already had, now + WebkitUserDrag) |
| GlobalScoreBlur: no real props received | 3 | ✓ zero props, always was |
| DimensionsPreview: fill values 68/52/74/61/58 | 4 | ✓ |
| DimensionsPreview: display "XX/20" (not 14/20 etc.) | 4 | ✓ |
| DimensionsPreview: select-none + pointer-events-none + WebkitUserDrag | 4 | ✓ |
| FakeReportPreview: lorem ipsum content | 5 | ✓ all paragraphs, bullets, highlights |
| FakeReportPreview: same structure + blur values | 5 | ✓ space-y-8, blur(4px) on titles, blur(5px) on content |
| FakeReportPreview: varied paragraph lengths | 5 | ✓ short/medium/long across 5 sections |
| FakeReportPreview: section titles unchanged | 5 | ✓ same 5 titles as before |
| paywall/page.tsx: no real data fetched | audit in Task 2 | ✓ already `.select("session_id")` only |
| Visual parity maintained (colors, layout, spacing) | all | ✓ no class/style changes to visual chrome |
| CTA #1 still ~1012px from top | — | ✓ no layout changes |
| No DB changes | — | ✓ |
| No API route changes | — | ✓ |
| TypeScript strict | all | ✓ `as React.CSSProperties` cast for WebkitUserDrag |

### Placeholder scan

No TBD. All code blocks are complete. No "similar to Task N" references.

### Type consistency

- `GlobalScoreBlur` — `{ filter, WebkitUserDrag } as React.CSSProperties` consistent across Tasks 3 and 4 ✓
- `FakeReportPreview` SECTIONS shape unchanged (`title`, `paragraphs`, `bullets`, `highlight`) — render function untouched ✓
- `FaqAccordion` — `FaqItem` type unchanged, FAQS array is `FaqItem[]` ✓
