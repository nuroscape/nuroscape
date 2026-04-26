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
      // In Stripe API 2026-03-25.dahlia, invoice.subscription was removed.
      // The subscription reference now lives at invoice.parent.subscription_details.subscription.
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof subRef === "string" ? subRef : (subRef?.id ?? null);

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
