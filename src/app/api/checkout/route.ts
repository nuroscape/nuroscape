import { z } from "zod";
import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/server";

const CheckoutBody = z.object({
  session_id: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }
  const parsed = CheckoutBody.safeParse(body);
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

  if (result.error) {
    console.error("[checkout] supabase error:", result.error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  const assessment = result.data as { paid: boolean } | null;

  if (!assessment) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
  if (assessment.paid) {
    return NextResponse.json({ error: "Déjà payé" }, { status: 409 });
  }

  let session: import("stripe").Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
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
      },
      { idempotencyKey: session_id }
    );
  } catch (err) {
    console.error("[checkout] stripe error:", err);
    return NextResponse.json({ error: "Erreur lors de la création de la session" }, { status: 502 });
  }

  if (!session.url) {
    console.error("[checkout] stripe session.url is null, session id:", session.id);
    return NextResponse.json({ error: "URL de redirection manquante" }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
