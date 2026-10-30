"use client";

import { AlarmClock } from "lucide-react";
import { useEffect, useState } from "react";

import {
  formatClock,
  LOW_MS,
  milestoneNote,
  msLeft,
} from "@/lib/session/timer";
import { cn } from "@/lib/utils";

// The Sunday test's countdown. Calls `onTimeUp` once the hour is over.
// Screen readers can read the clock on demand (role="timer" is never
// announced by itself), and hear a polite heads-up at 10, 5 and 1 minutes.
export function TestClock({
  startedAt,
  onTimeUp,
}: {
  startedAt: number;
  onTimeUp: () => void;
}) {
  const [left, setLeft] = useState(() => msLeft(startedAt, Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const ms = msLeft(startedAt, Date.now());
      setLeft(ms);
      if (ms === 0) onTimeUp();
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, onTimeUp]);

  // The last five minutes turn red, bold and gain an alarm icon, so the
  // change shows without relying on colour.
  const low = left <= LOW_MS;
  return (
    <>
      <p
        role="timer"
        className={cn(
          "flex items-center gap-1 font-mono text-sm tabular-nums",
          low ? "font-semibold text-danger" : "text-muted-foreground",
        )}
      >
        {low && <AlarmClock aria-hidden className="size-4" />}
        <span className="sr-only">Time left: </span>
        {formatClock(left)}
      </p>
      <p aria-live="polite" className="sr-only">
        {milestoneNote(left)}
      </p>
    </>
  );
}
