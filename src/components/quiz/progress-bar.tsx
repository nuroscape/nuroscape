"use client";

import { Progress } from "@/components/ui/progress";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function QuizProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Question {current} sur {total}</span>
        <span>{percent} %</span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}
