"use client";

import { useEffect } from "react";

export function AutoRefresh({ delayMs = 5000 }: { delayMs?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.reload(), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return null;
}
