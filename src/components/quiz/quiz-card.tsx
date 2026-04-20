"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuizProgressBar } from "./progress-bar";
import { useQuizStore } from "@/stores/quiz-store";

const QUESTIONS = [
  { id: "q1", text: "Vous avez du mal à prêter attention aux détails ou vous faites des fautes d'inattention.", category: "inattention" as const },
  { id: "q2", text: "Vous avez du mal à maintenir votre attention sur une tâche ou une activité.", category: "inattention" as const },
  { id: "q3", text: "Vous semblez ne pas écouter quand on vous parle directement.", category: "inattention" as const },
  { id: "q4", text: "Vous ne suivez pas les instructions et ne terminez pas vos tâches.", category: "inattention" as const },
  { id: "q5", text: "Vous avez du mal à organiser vos tâches et activités.", category: "inattention" as const },
  { id: "q6", text: "Vous évitez les tâches qui demandent un effort mental soutenu.", category: "inattention" as const },
  { id: "q7", text: "Vous perdez souvent des objets nécessaires à votre travail ou activités.", category: "inattention" as const },
  { id: "q8", text: "Vous êtes facilement distrait par des stimuli externes.", category: "inattention" as const },
  { id: "q9", text: "Vous oubliez souvent des activités quotidiennes.", category: "inattention" as const },
  { id: "q10", text: "Vous remuez les mains ou les pieds, ou vous frétillez sur votre siège.", category: "hyperactivity" as const },
  { id: "q11", text: "Vous vous levez de votre siège dans des situations où vous devriez rester assis.", category: "hyperactivity" as const },
  { id: "q12", text: "Vous courez ou grimpez dans des situations inappropriées.", category: "hyperactivity" as const },
  { id: "q13", text: "Vous avez du mal à jouer ou à vous livrer calmement à des loisirs.", category: "hyperactivity" as const },
  { id: "q14", text: "Vous êtes souvent « sur la brèche » ou agissez comme si vous étiez « motorisé ».", category: "hyperactivity" as const },
  { id: "q15", text: "Vous parlez trop.", category: "hyperactivity" as const },
  { id: "q16", text: "Vous répondez avant que les questions soient entièrement posées.", category: "hyperactivity" as const },
  { id: "q17", text: "Vous avez du mal à attendre votre tour.", category: "hyperactivity" as const },
  { id: "q18", text: "Vous interrompez les autres ou vous vous imposez à eux.", category: "hyperactivity" as const },
];

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
    responses[QUESTIONS[currentStep]?.id] ?? null
  );

  const question = QUESTIONS[currentStep];
  const isLast = currentStep === QUESTIONS.length - 1;

  if (!question) return null;

  const handleNext = () => {
    if (selected === null) return;
    setResponse(question.id, selected);

    if (isLast) {
      router.push("/dashboard");
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setSelected(responses[QUESTIONS[nextStep]?.id] ?? null);
    }
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    setSelected(responses[QUESTIONS[prevStep]?.id] ?? null);
  };

  return (
    <div className="w-full space-y-8">
      <QuizProgressBar current={currentStep + 1} total={QUESTIONS.length} />

      <div className="bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 block">
            {question.category === "inattention" ? "Inattention" : "Hyperactivité / Impulsivité"}
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
