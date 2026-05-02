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
  console.log("[webhook] received");
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
  } catch (err) {
    console.log("[webhook] signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[webhook] signature valid, event type:", event.type);

  const supabase = await createAdminClient();

  // Idempotency: insert the event_id; if it already exists, return 200 immediately.
  const { error: idempotencyError } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id });

  console.log("[webhook] idempotency insert result:", idempotencyError ?? "ok");

  if (idempotencyError) {
    if (idempotencyError.code === "23505") {
      // Unique violation → event already processed, tell Stripe we got it.
      return NextResponse.json({ received: true });
    }
    // Any other error (permission denied, table missing, …) → fail loudly so Stripe retries.
    throw idempotencyError;
  }

  console.log("[webhook] processing event", event.type);

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
        // Lookup direct dans auth.users (source de vérité, indépendant du trigger)
        const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          throw new Error(`Failed to list auth users: ${listError.message} (event: ${event.id})`);
        }
        const existingUser = usersList.users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error(`User not found in auth.users for email ${email} (event: ${event.id})`);
        }
        userId = existingUser.id;
      } else {
        userId = createResult.data.user.id;
      }

      // Garantir que le user existe dans public.users (au cas où le trigger
      // handle_new_user aurait foiré). Idempotent grâce à upsert.
      const { error: ensureUserError } = await supabase
        .from("users")
        .upsert(
          { id: userId, email },
          { onConflict: "id" }
        );
      if (ensureUserError) {
        throw new Error(`Failed to ensure user in public.users: ${ensureUserError.message} (event: ${event.id})`);
      }

      // Link assessment to user and mark as paid
      const { error: assessmentError } = await supabase
        .from("assessments")
        .update({ user_id: userId, paid: true })
        .eq("session_id", sessionId);
      if (assessmentError) throw assessmentError;

      // Narrow subscription to string ID regardless of whether Stripe returned an object or a string
      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription?.id ?? null);

      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? null);

      // Upsert subscription record
      const { error: upsertError } = await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_payment_intent_id: null,
          status: "trialing",
          plan: "trial",
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (upsertError) throw upsertError;

      // Resolve the assessment id so the magic link lands on the specific report.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      let reportPath = "/dashboard";
      const assessmentLookup = await supabase
        .from("assessments")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (assessmentLookup.data?.id) {
        reportPath = `/dashboard/report/${assessmentLookup.data.id}`;
      } else {
        console.warn("[webhook] assessment not found for session_id", sessionId, "— falling back to /dashboard");
      }

      // Send welcome email to ALL users (new and existing) so they can access the report
      try {
        const linkResult = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: `${appUrl}/auth/callback?next=${reportPath}`,
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

      const { error: subUpdatedError } = await supabase
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
      if (subUpdatedError) throw subUpdatedError;
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const { error: subDeletedError } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id);
      if (subDeletedError) throw subDeletedError;
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe API 2026-03-25.dahlia, invoice.subscription was removed.
      // The subscription reference now lives at invoice.parent.subscription_details.subscription.
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof subRef === "string" ? subRef : (subRef?.id ?? null);

      if (!subscriptionId) break;

      const { error: paymentFailedError } = await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);
      if (paymentFailedError) throw paymentFailedError;
      break;
    }
  }
  } catch (e) {
    console.log("[webhook] error caught:", e);
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
