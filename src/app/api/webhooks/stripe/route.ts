import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/server";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) break;

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "trialing",
        plan: "trial",
        trial_ends_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) break;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status as "active" | "canceled" | "past_due" | "trialing" | "incomplete",
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
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
