"use client";

import { Progress } from "@/components/ui/progress";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function QuizProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return <Progress value={percent} className="h-1.5" aria-label={`${percent}% complété`} />;
}
