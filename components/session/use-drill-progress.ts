"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { Result, WordCard } from "@/lib/session/machine";
import {
  PROGRESS_KEY,
  savedProgress,
  type DrillProgress,
} from "@/lib/session/progress";
import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

// Storage can be blocked (private browsing), so every access is guarded and
// the drill still works without it; there's just nothing to resume.
function readRaw(): string | null {
  try {
    return localStorage.getItem(PROGRESS_KEY);
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Keeps a drill's answers on this device as they're given, so leaving
// midway and coming back the same day carries on from the next word.
export function useDrillProgress(
  enabled: boolean,
  words: WordCard[],
  lastFinishedAt: string | null,
) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  // The server snapshot is null, so today's date is only read in the browser.
  const saved = useMemo(
    () =>
      enabled && raw
        ? savedProgress(
            raw,
            todayIn(HOUSEHOLD_TIME_ZONE),
            words,
            lastFinishedAt,
          )
        : null,
    [enabled, raw, words, lastFinishedAt],
  );

  const save = useCallback(
    (results: Result[], answerMs: number[]) => {
      if (!enabled) return;
      const progress: DrillProgress = {
        day: todayIn(HOUSEHOLD_TIME_ZONE),
        savedAt: new Date().toISOString(),
        wordIds: words.map((w) => w.id),
        results,
        answerMs,
      };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      } catch {
        // Full or blocked storage just means no resume.
      }
    },
    [enabled, words],
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // Nothing was saved, so there's nothing to clear.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { saved, save, clear };
}
