import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

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
      const email = session.customer_details?.email;
      const sessionId = session.metadata?.session_id;

      if (!email || !sessionId) break;

      // Create user (or retrieve if already exists)
      const createResult = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      let userId: string;

      if (createResult.error) {
        // User already exists — look up by email
        const existing = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (!existing.data?.id) break;
        userId = existing.data.id as string;
      } else {
        userId = createResult.data.user.id;

        // Send magic link so user can access their report
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

      // Link the anonymous assessment to the new user and mark as paid
      await supabase
        .from("assessments")
        .update({ user_id: userId, paid: true })
        .eq("session_id", sessionId);

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
  }

  return NextResponse.json({ received: true });
}
