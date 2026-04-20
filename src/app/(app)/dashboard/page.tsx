import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/dashboard/report-card";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const assessmentsResult = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });
  const assessments = assessmentsResult.data as Tables<"assessments">[] | null;

  const subscriptionResult = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("user_id", user!.id)
    .maybeSingle();
  const subscription = subscriptionResult.data as Pick<Tables<"subscriptions">, "status" | "plan"> | null;

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "vous";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-1">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          {subscription?.status === "active" || subscription?.status === "trialing"
            ? "Votre abonnement est actif."
            : "Commencez votre première évaluation."}
        </p>
      </div>

      {(!assessments || assessments.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-heading text-lg font-medium text-foreground mb-2">
            Aucune évaluation pour l&apos;instant
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Lancez votre première évaluation TDAH dès maintenant.
          </p>
          <Button render={<Link href="/quiz" />} className="rounded-full">
            Commencer l&apos;évaluation
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-medium text-foreground">
            Mes évaluations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {assessments.map((assessment) => (
              <ReportCard key={assessment.id} assessment={assessment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
