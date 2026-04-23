"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/stores/quiz-store";

export function QuizStartButton({
  className,
  arrowClassName,
}: {
  className?: string;
  arrowClassName?: string;
}) {
  const router = useRouter();
  const reset = useQuizStore((s) => s.reset);

  const handleStart = () => {
    reset();
    router.push("/quiz");
  };

  return (
    <Button onClick={handleStart} size="lg" className={className}>
      Commencer maintenant
      <ArrowRight className={arrowClassName} />
    </Button>
  );
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ml-2 w-4 h-4 flex-shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}
