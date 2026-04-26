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

  if (result.error) {
    console.error("[billing-portal] supabase error:", result.error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  const sub = result.data as Pick<
    Tables<"subscriptions">,
    "stripe_customer_id"
  > | null;

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
  }

  let portalSession: Awaited<ReturnType<typeof stripe.billingPortal.sessions.create>>;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`,
    });
  } catch (err) {
    console.error("[billing-portal] stripe error:", err);
    return NextResponse.json({ error: "Erreur lors de la création du portail" }, { status: 502 });
  }

  if (!portalSession.url) {
    console.error("[billing-portal] portal session url is null, session id:", portalSession.id);
    return NextResponse.json({ error: "URL du portail manquante" }, { status: 502 });
  }

  return NextResponse.json({ url: portalSession.url });
}
