import type { Metadata } from "next";
import { QuizCard } from "@/components/quiz/quiz-card";

export const metadata: Metadata = {
  title: "Évaluation TDAH",
};

export default function QuizPage() {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-2">
          Évaluation TDAH
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Répondez honnêtement à ces questions sur les 6 derniers mois. Il
          n&apos;y a pas de bonne ou mauvaise réponse.
        </p>
      </div>
      <QuizCard />
    </div>
  );
}
