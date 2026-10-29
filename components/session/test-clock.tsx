"use client";

import { useEffect, useState } from "react";

import { formatClock, LOW_MS, msLeft } from "@/lib/session/timer";
import { cn } from "@/lib/utils";

// The Sunday test's countdown. Calls `onTimeUp` once the hour is over.
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
    <p
      className={cn(
        "font-mono text-sm tabular-nums",
        left <= LOW_MS ? "text-danger" : "text-muted-foreground",
      )}
    >
      <span className="sr-only">Time left: </span>
      {formatClock(left)}
    </p>
  );
}
