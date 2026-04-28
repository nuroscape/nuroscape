# Phase 5 — Stripe Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Stripe skeleton into a production-ready checkout + webhook flow, add a Resend welcome email, billing portal route, and account page.

**Architecture:** The Stripe infrastructure (checkout route, webhook, config) already exists but has gaps: no idempotency, report generation blocks the webhook response, magic link only goes to new users, no `invoice.payment_failed` handler, no billing portal, no account page. This plan fills every gap without restructuring what already works.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Stripe `2026-03-25.dahlia`, Supabase admin client (`createAdminClient`), Resend, zod (already installed)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/003_stripe_integration.sql` | Create | `stripe_webhook_events` idempotency table |
| `src/types/database.ts` | Modify | Add `stripe_webhook_events` Row/Insert types |
| `src/app/api/checkout/route.ts` | Modify | Zod validation, existence check, 409, trial params, locale |
| `src/lib/resend.ts` | Modify | Add `sendWelcomeEmail(email, magicLink)` helper |
| `src/app/api/webhooks/stripe/route.ts` | Modify | Idempotency, magic link for all users, fire-and-forget report, `invoice.payment_failed` |
| `src/app/api/billing-portal/route.ts` | Create | Stripe billing portal session endpoint |
| `src/components/dashboard/billing-portal-button.tsx` | Create | Client component — POST to billing-portal, redirect |
| `src/app/(app)/dashboard/account/page.tsx` | Create | Account page: subscription status + billing portal button |
| `src/app/(app)/layout.tsx` | Modify | Add "Mon compte" nav link |

---

### Task 1: SQL migration + TypeScript types

**Files:**
- Create: `supabase/migrations/003_stripe_integration.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/003_stripe_integration.sql
-- Idempotency table for Stripe webhook events.
-- event_id is the Stripe event ID (e.g. "evt_1234...").
-- Before processing any webhook, we insert here.
-- If the INSERT fails (unique violation), the event was already handled → return 200.

create table public.stripe_webhook_events (
  id         uuid        primary key default gen_random_uuid(),
  event_id   text        not null unique,
  created_at timestamptz default now()
);

alter table public.stripe_webhook_events enable row level security;

-- Webhook handler uses service role key (createAdminClient) → RLS bypassed.
-- Deny all access from user JWTs as an extra safety layer.
create policy "deny all non-service-role" on public.stripe_webhook_events
  for all using (false) with check (false);
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the file above.
Expected: no error, table `stripe_webhook_events` visible in Table Editor.

> **Note for user:** This is a manual step. The migration cannot be run automatically from this environment.

- [ ] **Step 3: Add TypeScript types for the new table**

In `src/types/database.ts`, inside the `Tables` object (after the `subscriptions` block, before the closing brace), add:

```typescript
      stripe_webhook_events: {
        Row: {
          id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
        };
        Relationships: [];
      };
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build
```

Expected: `✓ Compiled successfully` (or type errors only from later tasks not yet implemented — check for no errors in `database.ts` itself)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/003_stripe_integration.sql src/types/database.ts
git commit -m "feat(db): add stripe_webhook_events idempotency table"
```

---

### Task 2: Harden checkout route

**Files:**
- Modify: `src/app/api/checkout/route.ts`

The current route has no input validation, no check that the assessment exists, no 409 for already-paid sessions, and no trial period params or locale.

- [ ] **Step 1: Rewrite `src/app/api/checkout/route.ts`**

Replace the entire file content with:

```typescript
import { z } from "zod";
import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const CheckoutBody = z.object({
  session_id: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = CheckoutBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
  }
  const { session_id } = parsed.data;

  const supabase = await createAdminClient();
  const result = await supabase
    .from("assessments")
    .select("paid")
    .eq("session_id", session_id)
    .maybeSingle();
  const assessment = result.data as Pick<Tables<"assessments">, "paid"> | null;

  if (!assessment) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
  if (assessment.paid) {
    return NextResponse.json({ error: "Déjà payé" }, { status: 409 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: STRIPE_PLANS.trial.priceId, quantity: 1 }],
    metadata: { session_id },
    subscription_data: {
      trial_period_days: STRIPE_PLANS.trial.trialDays,
      metadata: { session_id },
    },
    locale: "fr",
    consent_collection: { terms_of_service: "required" },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/quiz/merci`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paywall?session=${session_id}`,
    allow_promotion_codes: false,
  });

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: no TypeScript errors in `src/app/api/checkout/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat(checkout): add zod validation, existence check, 409, trial params"
```

---

### Task 3: Add `sendWelcomeEmail` to resend lib

**Files:**
- Modify: `src/lib/resend.ts`

The webhook calls `resend.emails.send(...)` inline. Extract it into a typed helper so the webhook is readable and the email template is testable in isolation.

- [ ] **Step 1: Rewrite `src/lib/resend.ts`**

Replace the entire file content with:

```typescript
import { Resend } from "resend";
import { env } from "@/env";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendWelcomeEmail(
  to: string,
  magicLink: string
): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Votre rapport Nuroscape est prêt",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E8E4DC">
        <tr><td style="background:#1A7A65;padding:28px 40px">
          <p style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.01em">Nuroscape</p>
        </td></tr>
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 16px;font-size:16px;color:#1c1e2a;line-height:1.6">Bonjour,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4a4d5e;line-height:1.7">
            Votre rapport personnalisé est prêt. Cliquez sur le bouton ci-dessous
            pour y accéder — aucun mot de passe nécessaire.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${magicLink}"
               style="display:inline-block;background:#1A7A65;color:#ffffff;font-size:15px;
                      font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none">
              Accéder à mon rapport
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:13px;color:#9397a6;line-height:1.5">
            Ce lien est valable 24 heures. Si vous n'avez pas demandé ce rapport,
            vous pouvez ignorer cet e-mail.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #E8E4DC">
          <p style="margin:0;font-size:12px;color:#9397a6">
            Nuroscape · nuroscape.com · 
            <a href="https://nuroscape.com/privacy" style="color:#9397a6">Confidentialité</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: no TypeScript errors in `src/lib/resend.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat(email): add sendWelcomeEmail helper with HTML template"
```

---

### Task 4: Rewrite webhook route

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

Four gaps to fix:
1. **No idempotency** — duplicate webhook deliveries reprocess the same event
2. **Magic link only for new users** — existing users pay but receive no email
3. **`generate-report` is awaited** — blocks webhook response, Stripe retries after 30s timeout
4. **No `invoice.payment_failed` handler** — subscription goes `past_due` silently

- [ ] **Step 1: Rewrite `src/app/api/webhooks/stripe/route.ts`**

Replace the entire file content with:

```typescript
import { after } from "next/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

export const runtime = "nodejs";
// Extend function lifetime so after() has time to call OpenAI (~10-30s).
// Vercel Pro required for >10s; Hobby plans cap at 10s regardless.
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Idempotency: insert the event_id; if it already exists, return 200 immediately.
  const { error: idempotencyError } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id });

  if (idempotencyError) {
    // Unique constraint violation → already processed. Respond 200 so Stripe stops retrying.
    return NextResponse.json({ received: true });
  }

  try {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      const sessionId = session.metadata?.session_id;

      if (!email || !sessionId) {
        // Throws → caught by outer try/catch → idempotency record rolled back → Stripe retries.
        throw new Error(`Missing email or sessionId on checkout.session.completed — Stripe metadata bug (event: ${event.id})`);
      }

      // Create user, or retrieve if already exists
      const createResult = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      let userId: string;

      if (createResult.error) {
        // Existing user — look up by email
        const existing = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (!existing.data?.id) {
          // Throws → catch block rolls back idempotency → Stripe retries
          throw new Error(`User not found after createUser error on email ${email} — possible auth service issue (event: ${event.id})`);
        }
        userId = existing.data.id as string;
      } else {
        userId = createResult.data.user.id;
      }

      // Link assessment to user and mark as paid
      await supabase
        .from("assessments")
        .update({ user_id: userId, paid: true })
        .eq("session_id", sessionId);

      // Narrow subscription to string ID regardless of whether Stripe returned an object or a string
      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription?.id ?? "");

      // Upsert subscription record
      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_payment_intent_id: null,
        status: "trialing",
        plan: "trial",
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Send welcome email to ALL users (new and existing) so they can access the report
      try {
        const linkResult = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
        });
        if (linkResult.data?.properties?.action_link) {
          await sendWelcomeEmail(email, linkResult.data.properties.action_link);
        }
      } catch (e) {
        console.error("[webhook] sendWelcomeEmail error:", e);
      }

      // Schedule report generation to run after the response is sent.
      // `after()` uses Vercel's waitUntil under the hood — safe in serverless.
      // A bare `void fetch()` would be killed when the function returns.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      after(() =>
        fetch(`${appUrl}/api/generate-report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
          },
          body: JSON.stringify({ session_id: sessionId }),
        }).catch((e: unknown) =>
          console.error("[webhook] generate-report error:", e)
        )
      );

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status as
            | "active"
            | "canceled"
            | "past_due"
            | "trialing"
            | "incomplete",
          current_period_end: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription?.id ?? null);

      if (!subscriptionId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);
      break;
    }
  }
  } catch (e) {
    // Rollback idempotency record so Stripe can retry this event.
    await supabase
      .from("stripe_webhook_events")
      .delete()
      .eq("event_id", event.id);
    console.error("[webhook] handler error, rolled back idempotency:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: no TypeScript errors in `src/app/api/webhooks/stripe/route.ts`.

- [ ] **Step 3: Smoke-test with Stripe CLI (manual)**

In a terminal with the dev server running (`npm run dev`):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

In a second terminal, trigger a test event:
```bash
stripe trigger checkout.session.completed
```

Expected in dev server logs:
- `[webhook] generate-report fire-and-forget error:` may appear (localhost generate-report may fail — that's OK, it's fire-and-forget)
- `[webhook] sendWelcomeEmail error:` may appear if RESEND_API_KEY isn't set locally — that's OK
- Stripe CLI shows `200 OK`

Run the same event a second time:
```bash
stripe trigger checkout.session.completed
```
Expected: same `200 OK` — idempotency working (no duplicate DB writes).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(webhook): add idempotency, magic link for all users, fire-and-forget report, payment_failed"
```

---

### Task 5: Add billing portal route

**Files:**
- Create: `src/app/api/billing-portal/route.ts`

- [ ] **Step 1: Create `src/app/api/billing-portal/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import type { Tables } from "@/types/database";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const result = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const sub = result.data as Pick<
    Tables<"subscriptions">,
    "stripe_customer_id"
  > | null;

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

Expected: no TypeScript errors in `src/app/api/billing-portal/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/billing-portal/route.ts
git commit -m "feat(billing): add Stripe billing portal route"
```

---

### Task 6: Account page + nav link

**Files:**
- Create: `src/components/dashboard/billing-portal-button.tsx`
- Create: `src/app/(app)/dashboard/account/page.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create the billing portal button client component**

Create `src/components/dashboard/billing-portal-button.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      if (!res.ok) {
        console.error("[billing-portal] error:", res.status);
        setLoading(false);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      if (url) window.location.href = url;
    } catch (e) {
      console.error("[billing-portal] fetch error:", e);
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full"
    >
      {loading ? "Chargement…" : "Gérer mon abonnement"}
    </Button>
  );
}
```

- [ ] **Step 2: Create `src/app/(app)/dashboard/account/page.tsx`**

```typescript
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Mon compte",
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "Période d'essai active",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Annulé",
  incomplete: "Incomplet",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await supabase
    .from("subscriptions")
    .select("status, plan, trial_ends_at, current_period_end")
    .eq("user_id", user!.id)
    .maybeSingle();

  const subscription = result.data as Pick<
    Tables<"subscriptions">,
    "status" | "plan" | "trial_ends_at" | "current_period_end"
  > | null;

  // Show portal for all non-terminal states — past_due users need it most.
  const canManageSubscription =
    subscription !== null &&
    subscription.status !== "canceled" &&
    subscription.status !== "incomplete";

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1
          className="font-heading font-light text-2xl sm:text-3xl text-foreground tracking-[-0.015em] mb-1"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Mon compte
        </h1>
        <p className="text-sm text-muted-foreground">{user!.email}</p>
      </div>

      {/* Subscription card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h2
          className="font-heading font-light text-lg text-foreground tracking-[-0.01em]"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 0' }}
        >
          Abonnement
        </h2>

        {subscription ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Statut</span>
              <span className="font-medium text-foreground">
                {STATUS_LABELS[subscription.status] ?? subscription.status}
              </span>
            </div>

            {subscription.status === "trialing" && subscription.trial_ends_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fin de l&apos;essai</span>
                <span className="font-medium text-foreground">
                  {new Date(subscription.trial_ends_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {subscription.status === "active" && subscription.current_period_end && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prochain renouvellement</span>
                <span className="font-medium text-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun abonnement actif.</p>
        )}

        {canManageSubscription && (
          <div className="pt-1">
            <BillingPortalButton />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add "Mon compte" link to the app layout**

In `src/app/(app)/layout.tsx`, find the existing nav section:

```typescript
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Tableau de bord
          </Link>
```

Replace it with:

```typescript
          <nav className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tableau de bord
            </Link>
            <Link
              href="/dashboard/account"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mon compte
            </Link>
          </nav>
```

- [ ] **Step 4: Build to verify**

```bash
npm run build
```

Expected: `✓ Compiled successfully` — all 6 files type-check clean.

- [ ] **Step 5: Manual smoke test**

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/dashboard/account` while logged in
3. Verify: subscription status displayed, "Gérer mon abonnement" button visible for active/trialing users
4. Click "Gérer mon abonnement" → should redirect to Stripe billing portal (or `404` if no subscription in Stripe test mode — both are correct behaviors)

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/billing-portal-button.tsx src/app/(app)/dashboard/account/page.tsx src/app/(app)/layout.tsx
git commit -m "feat(account): add billing portal button, account page, nav link"
```

---

---

### Task 7: Vitest setup + critical path tests

**Files:**
- Modify: `package.json` (add test scripts)
- Create: `vitest.config.ts`
- Create: `src/tests/api/checkout.test.ts`
- Create: `src/tests/api/webhook-idempotency.test.ts`
- Create: `src/tests/api/billing-portal.test.ts`

The goal: cover the 3 paths most likely to cause silent production failures — the checkout duplicate-payment guard, the webhook idempotency early-exit, and the billing portal auth check.

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

Expected: `vitest` and `@vitest/coverage-v8` appear in `devDependencies` in `package.json`.

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "node", globals: true },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

In `package.json`, inside the `"scripts"` object, add:

```json
"test": "vitest",
"test:coverage": "vitest --coverage"
```

- [ ] **Step 4: Create `src/tests/api/checkout.test.ts`**

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/stripe/config", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }) } },
  },
  STRIPE_PLANS: { trial: { priceId: "price_test", trialDays: 7 } },
}));

import { POST } from "@/app/api/checkout/route";
import { createAdminClient } from "@/lib/supabase/server";

function mockDb(paid: boolean | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({
            data: paid === null ? null : { paid },
            error: null,
          }),
        }),
      }),
    }),
  };
}

function req(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 — missing session_id", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("404 — assessment not found", async () => {
    vi.mocked(createAdminClient).mockResolvedValue(mockDb(null) as any);
    const res = await POST(req({ session_id: "ghost" }));
    expect(res.status).toBe(404);
  });

  it("409 — already paid", async () => {
    vi.mocked(createAdminClient).mockResolvedValue(mockDb(true) as any);
    const res = await POST(req({ session_id: "paid-session" }));
    expect(res.status).toBe(409);
  });

  it("200 — returns Stripe URL for unpaid assessment", async () => {
    vi.mocked(createAdminClient).mockResolvedValue(mockDb(false) as any);
    const res = await POST(req({ session_id: "fresh-session" }));
    expect(res.status).toBe(200);
    const json = await res.json() as { url: string };
    expect(json.url).toBe("https://checkout.stripe.com/test");
  });
});
```

- [ ] **Step 5: Run checkout tests — verify they pass**

```bash
npx vitest run src/tests/api/checkout.test.ts
```

Expected: `4 passed`.

- [ ] **Step 6: Create `src/tests/api/webhook-idempotency.test.ts`**

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
  after: vi.fn(), // no-op in tests
}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/stripe/config", () => ({ stripe: { webhooks: { constructEvent: vi.fn() } } }));
vi.mock("@/lib/resend", () => ({ sendWelcomeEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from "@/app/api/webhooks/stripe/route";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import { headers } from "next/headers";

function makeEvent(id: string, type = "customer.subscription.updated") {
  return {
    id,
    type,
    data: { object: { id: "sub_test", status: "active", cancel_at: null } },
  };
}

function makeRequest() {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/webhooks/stripe — idempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 immediately for duplicate event_id without processing business logic", async () => {
    const updateFn = vi.fn();
    vi.mocked(headers).mockResolvedValue({
      get: (k: string) => (k === "stripe-signature" ? "sig" : null),
    } as any);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(makeEvent("evt_dup") as any);
    vi.mocked(createAdminClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "stripe_webhook_events")
          return { insert: vi.fn().mockResolvedValue({ error: { code: "23505" } }) };
        return { update: updateFn };
      },
    } as any);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(updateFn).not.toHaveBeenCalled();
  });

  it("processes a new event_id and updates the subscription", async () => {
    const idempotencyInsert = vi.fn().mockResolvedValue({ error: null });
    const subUpdateEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(headers).mockResolvedValue({
      get: (k: string) => (k === "stripe-signature" ? "sig" : null),
    } as any);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(makeEvent("evt_new") as any);
    vi.mocked(createAdminClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "stripe_webhook_events") return { insert: idempotencyInsert };
        if (table === "subscriptions") return { update: () => ({ eq: subUpdateEq }) };
        return {};
      },
    } as any);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(idempotencyInsert).toHaveBeenCalledWith({ event_id: "evt_new" });
    expect(subUpdateEq).toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run webhook tests — verify they pass**

```bash
npx vitest run src/tests/api/webhook-idempotency.test.ts
```

Expected: `2 passed`.

- [ ] **Step 8: Create `src/tests/api/billing-portal.test.ts`**

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/config", () => ({
  stripe: {
    billingPortal: {
      sessions: { create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/session_test" }) },
    },
  },
}));

import { POST } from "@/app/api/billing-portal/route";
import { createClient } from "@/lib/supabase/server";

describe("POST /api/billing-portal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 — unauthenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("404 — authenticated user with no subscription", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user_123" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
        }),
      }),
    } as any);

    const res = await POST();
    expect(res.status).toBe(404);
  });

  it("200 — returns Stripe billing portal URL", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user_123" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({
              data: { stripe_customer_id: "cus_test" },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json() as { url: string };
    expect(json.url).toBe("https://billing.stripe.com/session_test");
  });
});
```

- [ ] **Step 9: Run billing portal tests — verify they pass**

```bash
npx vitest run src/tests/api/billing-portal.test.ts
```

Expected: `3 passed`.

- [ ] **Step 10: Run full test suite**

```bash
npx vitest run
```

Expected: `9 passed` (4 checkout + 2 webhook + 3 billing portal).

- [ ] **Step 11: Commit**

```bash
git add vitest.config.ts package.json src/tests/
git commit -m "test(stripe): add vitest setup + critical path tests for checkout, webhook, billing portal"
```

---

## Manual Steps Required (cannot be automated)

1. **Run SQL migration:** Supabase Dashboard → SQL Editor → run `supabase/migrations/003_stripe_integration.sql`
2. **Add `INTERNAL_API_SECRET`** to Vercel environment variables (same value as in `.env.local`)
3. **Add `RESEND_FROM_EMAIL`** to Vercel environment variables (e.g. `noreply@nuroscape.com`)
4. **Register Stripe webhook** in Stripe Dashboard → Webhooks → add endpoint `https://nuroscape.com/api/webhooks/stripe` → select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. **Configure Stripe billing portal** in Stripe Dashboard → Billing → Customer portal → enable cancel subscription, update payment method
6. **Add Terms of Service URL** in Stripe Dashboard → Settings → Checkout → Policies (required for `consent_collection: { terms_of_service: "required" }` to render)

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Idempotent webhook (no duplicate processing) | Task 1 (SQL) + Task 4 (insert at top) |
| Magic link for ALL users after payment | Task 4 |
| Fire-and-forget report generation | Task 4 |
| `invoice.payment_failed` → `past_due` | Task 4 |
| Zod validation on checkout | Task 2 |
| 404 on unknown session_id | Task 2 |
| 409 on already-paid session | Task 2 |
| `trial_period_days: 7` on checkout | Task 2 |
| `locale: "fr"` on checkout | Task 2 |
| Welcome email with branded HTML | Task 3 |
| Billing portal route | Task 5 |
| Account page with subscription status | Task 6 |
| "Mon compte" nav link | Task 6 |

---

## GSTACK REVIEW REPORT

Generated by `/plan-eng-review` on 2026-04-25. Branch: `main`. Commit: `fc1edba`.

### Review Readiness

| Review        | Status        | Last Run            | Commit    |
|---------------|---------------|---------------------|-----------|
| Eng Review    | CLEAR (PLAN)  | 2026-04-25 21:23    | fc1edba   |
| CEO Review    | —             | —                   | —         |
| Design Review | —             | —                   | —         |
| Adversarial   | —             | —                   | —         |
| Outside Voice | issues_found  | 2026-04-25 21:18    | fc1edba   |

**VERDICT: CLEARED** — Eng Review passed. Ship when ready.

### Issues Found and Resolved (12 total)

| # | Section | Severity | Description | Decision |
|---|---------|----------|-------------|----------|
| 1 | Architecture | P1 | `void fetch()` kills generate-report on Vercel | Fixed → `after()` from `next/server` |
| 2 | Code Quality | P1 | Idempotency insert-first → rollback not done on failure | Fixed → try/catch + rollback |
| 3 | Code Quality | P1 | `past_due` users blocked from billing portal | Fixed → `canManageSubscription` logic |
| 4 | Code Quality | P2 | `process.env.RESEND_FROM_EMAIL!` in lib file | Fixed → `env.RESEND_FROM_EMAIL` |
| 5 | Code Quality | P2 | `consent_collection` missing from checkout | Fixed → added to plan |
| 6 | Tests | P1 | 0% coverage on payment-critical routes | Fixed → Task 7 (9 vitest tests) |
| 7 | Performance | P3 | Sequential DB calls in webhook (100ms) | Kept sequential — no change |
| 8 | Outside Voice | P1 | Silent `break` on missing email/sessionId → paid user in limbo | Fixed → throw instead of break |
| 9 | Outside Voice | P2 | No `export const maxDuration = 60` → report generation killed | Fixed → added to plan |
| 10 | Outside Voice | P2 | `session.subscription` cast without type narrowing | Fixed → explicit narrowing |
| 11 | Outside Voice | P2 | Duplicate welcome email on webhook retry | Accepted risk — kept as-is |
| 12 | Failure Modes | P1 | Silent `break` on user lookup failure → paid user in limbo | Fixed → throw instead of break |

### TODOS Added

- E2E test coverage for full payment flow (vitest unit tests added, Playwright still missing)
- `RESEND_API_KEY` to env.ts startup validation
- `report_status` column for report generation failure tracking
