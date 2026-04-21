"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuizProgressBar } from "./progress-bar";
import { useQuizStore } from "@/stores/quiz-store";
import { SORTED_QUESTIONS, CATEGORY_LABELS } from "@/data/questions";

const ANSWERS = [
  { value: 0, label: "Jamais" },
  { value: 1, label: "Parfois" },
  { value: 2, label: "Souvent" },
  { value: 3, label: "Très souvent" },
];

export function QuizCard() {
  const router = useRouter();
  const { currentStep, responses, setCurrentStep, setResponse } = useQuizStore();
  const [selected, setSelected] = useState<number | null>(
    responses[SORTED_QUESTIONS[currentStep]?.id] ?? null
  );

  const question = SORTED_QUESTIONS[currentStep];
  const total = SORTED_QUESTIONS.length;
  const isLast = currentStep === total - 1;

  if (!question) return null;

  const handleNext = () => {
    if (selected === null) return;
    setResponse(question.id, selected);

    if (isLast) {
      router.push("/quiz/loading");
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setSelected(responses[SORTED_QUESTIONS[nextStep]?.id] ?? null);
    }
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    setSelected(responses[SORTED_QUESTIONS[prevStep]?.id] ?? null);
  };

  return (
    <div className="w-full space-y-8">
      <QuizProgressBar current={currentStep + 1} total={total} />

      <div className="bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 block">
            {CATEGORY_LABELS[question.category]}
          </span>
          <p className="font-heading text-lg sm:text-xl font-medium text-foreground leading-snug">
            {question.text}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ANSWERS.map((answer) => (
            <button
              key={answer.value}
              onClick={() => setSelected(answer.value)}
              className={`
                rounded-xl border-2 p-4 text-sm font-medium transition-all duration-150 text-center
                ${selected === answer.value
                  ? "border-primary bg-primary/8 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/4"
                }
              `}
            >
              {answer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="rounded-full"
        >
          ← Précédent
        </Button>
        <Button
          onClick={handleNext}
          disabled={selected === null}
          className="rounded-full flex-1 sm:flex-none sm:min-w-36"
        >
          {isLast ? "Voir mon rapport" : "Suivant →"}
        </Button>
      </div>
    </div>
  );
}
