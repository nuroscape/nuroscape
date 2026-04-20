import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

export const STRIPE_PLANS = {
  trial: {
    priceId: process.env.STRIPE_TRIAL_PRICE_ID!,
    amount: 199,
    currency: "eur",
    interval: "week" as const,
    trialDays: 7,
    label: "Essai 7 jours",
    displayPrice: "1,99 €",
  },
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 1499,
    currency: "eur",
    interval: "month" as const,
    label: "Mensuel",
    displayPrice: "14,99 €/mois",
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
