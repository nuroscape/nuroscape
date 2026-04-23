"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/stores/quiz-store";

const STEPS = [
  "Analyse de vos réponses…",
  "Identification de vos patterns…",
  "Génération de votre rapport…",
];

export default function QuizLoadingPage() {
  const router = useRouter();
  const { responses } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  // Prevent double-calls (StrictMode, Réessayer spam)
  const calling = useRef(false);

  useEffect(() => {
    // Zustand hydration guard: setMounted fires once on mount so dependent
    // effects run only after localStorage has been rehydrated. Empty deps →
    // exactly one extra render, no cascade risk.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Redirect back if no quiz responses
  useEffect(() => {
    if (mounted && Object.keys(responses).length === 0) {
      router.replace("/quiz");
    }
  }, [mounted, responses, router]);

  // Step animation — runs once on mount, independent of API
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 3600);
    const t3 = setTimeout(() => setAnimDone(true), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const callApi = useCallback(async () => {
    if (calling.current) return;
    calling.current = true;
    setError(false);
    setSessionId(null);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const data = (await res.json()) as { session_id?: string; error?: string };
      if (data.session_id) {
        setSessionId(data.session_id);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      calling.current = false;
    }
  }, [responses]);

  // Start API call once Zustand has hydrated
  useEffect(() => {
    if (!mounted || Object.keys(responses).length === 0) return;
    // callApi fires once when mounted flips true. calling.current ref prevents
    // re-entry; callApi never updates mounted so this effect never re-fires.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    callApi();
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect when animation AND API are both done
  useEffect(() => {
    if (sessionId && animDone) {
      router.push(`/paywall?session=${sessionId}`);
    }
  }, [sessionId, animDone, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <p className="text-muted-foreground text-sm max-w-xs">
          Une erreur s&apos;est produite. Vos réponses sont conservées — réessayez.
        </p>
        <button
          onClick={callApi}
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-12 w-full">
      {/* Animated orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
        <div className="absolute inset-4 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.8s" }} />
        <div className="absolute inset-6 rounded-full bg-primary flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary-foreground/80" />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-xs">
        {STEPS.map((label, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-500 ${
              i > step ? "opacity-25" : "opacity-100"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                i < step
                  ? "bg-primary"
                  : i === step
                  ? "border-2 border-primary bg-primary/10"
                  : "border-2 border-border bg-background"
              }`}
            >
              {i < step && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                </svg>
              )}
              {i === step && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </span>
            <span
              className={`text-sm transition-all duration-500 ${
                i === step
                  ? "text-foreground font-medium"
                  : i < step
                  ? "text-muted-foreground"
                  : "text-muted-foreground/40"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
        Cette analyse peut prendre quelques secondes.
      </p>
    </div>
  );
}
