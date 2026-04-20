# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server (Turbopack, port 3000)
npm run build      # Type-check + production build
npm run lint       # ESLint
```

Both `dev` and `build` automatically delete `src/middleware.ts` via a `pre*` script — this is intentional (see proxy section below).

To skip env validation during builds when secrets aren't available:
```bash
SKIP_ENV_VALIDATION=1 npm run build
```

## Architecture

### Route groups

```
src/app/
  page.tsx              → / (marketing home)
  (marketing)/          → shared layout for future marketing pages (/pricing, /about)
  (auth)/               → /login, /register  (no auth required)
  (app)/                → /dashboard and subpages  (auth required — server-side redirect in layout)
  quiz/                 → /quiz  (public, quiz state in Zustand)
  api/
    generate-report/    → POST: call OpenAI, save report HTML to DB
    webhooks/stripe/    → POST: handle checkout.session.completed, subscription events
```

### Auth & session

- **Route protection** lives in `src/proxy.ts` — this is Next.js 16's replacement for `middleware.ts`. Export must be named `proxy`, not `middleware`. Protected paths: `/app`, `/dashboard`. Auth paths: `/login`, `/register`.
- Server Components use `await createClient()` from `@/lib/supabase/server` (async — Next.js 16 `cookies()` is async).
- Client Components use `createClient()` from `@/lib/supabase/client`.
- `createAdminClient()` uses the service role key — only in API routes, never in Server Components exposed to the client.

### Environment variables

All env vars are validated at startup via `@t3-oss/env-nextjs` in `src/env.ts`. Import `env` from there when you need server-side vars in non-route code. Route files can use `process.env` directly since Next.js validates at the edge.

### Server Actions

Use `src/lib/safe-action.ts`:
- `action` — public (unauthenticated)
- `authedAction` — injects `{ user, supabase }` into context after verifying session

### Supabase typing

`src/types/database.ts` is the hand-written Database type. **Every table must include `Relationships: []`** or TypeScript resolves all query return types as `never`. When adding tables, copy the shape of an existing table.

Supabase query results are typed as `never` in some edge cases — use explicit casts:
```ts
const result = await supabase.from("table").select("*").maybeSingle();
const row = result.data as Tables<"table"> | null;
```

### Stripe

Stripe API version: `2026-03-25.dahlia`. The `current_period_end` field no longer exists on `Stripe.Subscription` in this API version — use `cancel_at` instead.

### Quiz state

`src/stores/quiz-store.ts` — Zustand store with `persist` middleware, keyed `nuroscape-quiz` in localStorage. Holds step index, responses (`Record<questionId, 0–3>`), and `assessmentId`. Call `reset()` after submitting.

### UI components (shadcn nova / Base UI)

Components in `src/components/ui/` are built on `@base-ui/react`, **not** Radix UI. The `asChild` prop does not exist. To render a `Button` as a link:

```tsx
// ✅ Correct (Base UI)
<Button render={<Link href="/path" />}>Label</Button>

// ❌ Wrong — asChild not supported
<Button asChild><Link href="/path">Label</Link></Button>
```

### Design system

Fonts loaded via `next/font/google` in `src/app/layout.tsx`:
- `--font-heading` → Fraunces (display, serif)
- `--font-sans` → DM Sans (body)

Tailwind tokens map to CSS custom properties defined in `src/app/globals.css` under `@theme inline`. Primary color: deep teal (`oklch(0.42 0.128 168)`). Accent: warm amber (`oklch(0.72 0.135 55)`).

### Database schema

Three tables in `supabase/migrations/001_init.sql`: `users` (mirrors `auth.users`), `assessments` (quiz results + AI report HTML), `subscriptions` (Stripe state). RLS is enabled on all tables. A trigger auto-creates a `users` row on `auth.users` insert.
