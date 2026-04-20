"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QuizResponse = {
  questionId: string;
  value: number; // 0=jamais 1=parfois 2=souvent 3=très souvent
};

type QuizStore = {
  currentStep: number;
  responses: Record<string, number>;
  assessmentId: string | null;
  startedAt: string | null;
  setCurrentStep: (step: number) => void;
  setResponse: (questionId: string, value: number) => void;
  setAssessmentId: (id: string) => void;
  reset: () => void;
};

const initialState = {
  currentStep: 0,
  responses: {},
  assessmentId: null,
  startedAt: null,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...initialState,
      setCurrentStep: (step) => set({ currentStep: step }),
      setResponse: (questionId, value) =>
        set((state) => ({
          responses: { ...state.responses, [questionId]: value },
          startedAt: state.startedAt ?? new Date().toISOString(),
        })),
      setAssessmentId: (id) => set({ assessmentId: id }),
      reset: () => set(initialState),
    }),
    {
      name: "nuroscape-quiz",
      partialize: (state) => ({
        currentStep: state.currentStep,
        responses: state.responses,
        assessmentId: state.assessmentId,
        startedAt: state.startedAt,
      }),
    }
  )
);
