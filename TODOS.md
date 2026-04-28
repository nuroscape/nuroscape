# TODOS

## Test infrastructure — E2E gap (unit tests added in Phase 5)

**What:** Add Playwright E2E tests for the full checkout → Stripe → webhook → report unlock flow. Vitest unit tests (9 tests across checkout, webhook, billing portal) were added in Phase 5.

**Why:** Unit tests cover individual endpoints but can't catch integration failures across the payment flow: a working checkout + a broken webhook + a passing test suite = a user who paid and got nothing. E2E is the only layer that catches this.

**Pros:** Catches end-to-end regressions. The Stripe CLI + Playwright combo can simulate the full flow in test mode.

**Cons:** Setup complexity — requires Stripe test mode + test webhook endpoint + Playwright browser.

**Context:** Original "0% coverage" concern addressed by Phase 5 vitest setup. Remaining gap is full E2E payment flow. Flagged during plan-eng-review of Phase 5 plan (2026-04-25).

**Depends on:** Phase 5 shipping (Task 7 vitest setup).

---

## Add `RESEND_API_KEY` to env.ts startup validation

**What:** Add `RESEND_API_KEY` to `src/env.ts` as a required server-only env var (zod `z.string().min(1)`). Change `src/lib/resend.ts` to use `env.RESEND_API_KEY` instead of `process.env.RESEND_API_KEY!`.

**Why:** If `RESEND_API_KEY` is missing in production, the Resend client initializes with `undefined`. Welcome emails silently fail after payment. No startup error, no alert. Fast-fail at startup is strictly better.

**Pros:** Consistent with the project's env validation pattern (`env.ts` already validates `RESEND_FROM_EMAIL`). CLAUDE.md rule: lib files must use `env` from `@/env`, not `process.env`.

**Cons:** One more required env var to configure on Vercel (already needed, just now enforced).

**Context:** Flagged during plan-eng-review of Phase 5 (2026-04-25). Phase 5 fixes `RESEND_FROM_EMAIL` but not `RESEND_API_KEY`.

**Depends on:** Nothing. 2-minute change.

---

## Report generation failure tracking (`report_status` column)

**What:** Add `report_status: 'pending' | 'generating' | 'done' | 'failed'` to the `assessments` table. Set to `pending` in the webhook on checkout. Update to `done`/`failed` in `generate-report`. An admin query finds all failed reports for manual retry.

**Why:** `generate-report` is fire-and-forget via `after()`. If OpenAI times out or the function is killed, the failure is only visible in Vercel logs. The user sees an empty report with no explanation. No retry path exists.

**Pros:** Closes the monitoring gap. Makes failed-report detection operational (query `WHERE report_status = 'failed'`). Enables future cron-based retry.

**Cons:** New migration + update to `generate-report` route. Scope expansion from Phase 5.

**Context:** Flagged by outside voice review during plan-eng-review of Phase 5 (2026-04-25). The `maxDuration = 60` fix reduces risk but doesn't eliminate it.

**Depends on:** Phase 5 shipped.

---

## Dynamic metadata for /dashboard/report/[id]

**What:** Replace `export const metadata: Metadata = { title: "Mon rapport TDAH" }` with a `generateMetadata` function that includes the assessment date.

**Why:** Static title shows "Mon rapport TDAH" in browser history and bookmarks regardless of which assessment. `generateMetadata` can return "Rapport du 22 avril 2026" for a better UX on repeat visits.

**Pros:** Better browser UX, better for future email-linked reports.

**Cons:** One extra Supabase query per page (or reuse params to look it up).

**Context:** Flagged during plan-eng-review of Phase 4 plan. Not worth blocking Phase 4 for.

**Depends on:** `src/app/(app)/dashboard/report/[id]/page.tsx` (Task 3 of Phase 4 plan).
