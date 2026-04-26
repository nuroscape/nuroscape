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
