"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { generateThisWeek } from "./actions";

// Shown when the household has no list for this week yet, so the first
// visit of the week makes it without a click. The server action does nothing
// if the other person's visit got there first.
export function MakeThisWeek() {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  function make() {
    startTransition(async () => {
      try {
        await generateThisWeek();
      } catch {
        setFailed(true);
      }
    });
  }

  // Once per page load, even when React runs effects twice in development.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    make();
  }, []);

  if (failed && !pending) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p role="alert" className="text-sm text-muted-foreground">
          This week&apos;s list couldn&apos;t be made just now.
        </p>
        <Button
          onClick={() => {
            setFailed(false);
            make();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div aria-live="polite" className="flex flex-col items-center gap-1">
      <p className="font-medium">Writing this week&apos;s list…</p>
      <p className="text-sm text-muted-foreground">
        This can take up to a minute.
      </p>
    </div>
  );
}
