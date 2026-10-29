"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Mode, Result } from "@/lib/session/machine";
import { shareText } from "@/lib/session/share";
import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

// Copies a spoiler-free summary of the session to paste into a chat. A test
// is shared under its week's Monday, and a drill under the day it's copied.
export function CopyResult({
  mode,
  weekStartsOn,
  results,
}: {
  mode: Mode;
  weekStartsOn?: string;
  results: Result[];
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const date =
      mode === "test" && weekStartsOn
        ? weekStartsOn
        : todayIn(HOUSEHOLD_TIME_ZONE);
    try {
      await navigator.clipboard.writeText(shareText(mode, date, results));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button onClick={copy}>
        {status === "copied" ? "Copied!" : "Copy result"}
      </Button>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {status === "failed" && "Couldn't copy. Try again."}
      </p>
    </div>
  );
}
