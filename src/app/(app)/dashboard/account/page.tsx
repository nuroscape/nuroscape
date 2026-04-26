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
