"use client";

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

  return (
    <>
      <p
        role="timer"
        className={cn(
          "font-mono text-sm tabular-nums",
          left <= LOW_MS ? "text-danger" : "text-muted-foreground",
        )}
      >
        <span className="sr-only">Time left: </span>
        {formatClock(left)}
      </p>
      <p aria-live="polite" className="sr-only">
        {milestoneNote(left)}
      </p>
    </>
  );
}
