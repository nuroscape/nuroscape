# TODOS

## Test infrastructure

**What:** Set up vitest + React Testing Library + Playwright for the Nuroscape codebase.

**Why:** 0% test coverage on a SaaS with payment redirects and auth-gated report pages is a liability. Bugs in the `paid` check, RLS config, or paywall redirect are invisible until they hit users.

**Pros:** Catches regressions before prod. CI-gated safety net. The Stripe webhook and report fetch flows are exactly the kind of code that breaks silently.

**Cons:** Setup time (~30min with CC+gstack). Some Next.js 16 App Router components are harder to test (server components need dedicated tooling).

**Context:** As of 2026-04-22, the project has no test files, no jest/vitest config, no spec/ directory. Flagged during plan-eng-review of Phase 4 plan.

**Depends on:** Nothing. Can be started independently at any time.

---

## Dynamic metadata for /dashboard/report/[id]

**What:** Replace `export const metadata: Metadata = { title: "Mon rapport TDAH" }` with a `generateMetadata` function that includes the assessment date.

**Why:** Static title shows "Mon rapport TDAH" in browser history and bookmarks regardless of which assessment. `generateMetadata` can return "Rapport du 22 avril 2026" for a better UX on repeat visits.

**Pros:** Better browser UX, better for future email-linked reports.

**Cons:** One extra Supabase query per page (or reuse params to look it up).

**Context:** Flagged during plan-eng-review of Phase 4 plan. Not worth blocking Phase 4 for.

**Depends on:** `src/app/(app)/dashboard/report/[id]/page.tsx` (Task 3 of Phase 4 plan).
