import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe/config";

export async function POST(request: Request) {
  const { session_id } = (await request.json()) as { session_id: string };

  if (!session_id) {
    return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: STRIPE_PLANS.trial.priceId, quantity: 1 }],
    metadata: { session_id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/quiz/merci`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paywall?session=${session_id}`,
    allow_promotion_codes: false,
  });

  return NextResponse.json({ url: session.url });
}
