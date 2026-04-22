import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Tables } from "@/types/database";
import type { Json } from "@/types/database";
import type { ScoresJson } from "@/data/questions";

type ReportCardProps = {
  assessment: Tables<"assessments">;
};

export function ReportCard({ assessment }: ReportCardProps) {
  const date = new Date(assessment.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isPaid = assessment.paid;
  const scores = assessment.scores as Json as ScoresJson | null;

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-base font-medium text-foreground">
              Évaluation TDAH
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
          </div>
          <Badge
            variant={isPaid ? "default" : "secondary"}
            className="rounded-full text-xs shrink-0"
          >
            {isPaid ? "Complétée" : "En attente"}
          </Badge>
        </div>
      </CardHeader>
      {isPaid && scores && (
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xl font-heading font-semibold text-foreground">
                {scores.inattention?.raw ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Inattention</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-semibold text-foreground">
                {scores.hyperactivity?.raw ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Hyperactivité</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-semibold text-primary">
                {scores.global?.raw ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total /84</p>
            </div>
          </div>
          {assessment.report && (
            <Link
              href={`/dashboard/report/${assessment.id}`}
              className="text-sm text-primary hover:underline font-medium"
            >
              Lire le rapport complet →
            </Link>
          )}
        </CardContent>
      )}
    </Card>
  );
}
