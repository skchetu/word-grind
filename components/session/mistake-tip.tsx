"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

import { getMistakeTip } from "@/app/actions";

// A one-line tip about this exact misspelling, from Claude or the tip cache,
// falling back to the word's memory hint. Shows nothing if it can't load, so
// a slow or failed call never blocks moving on.
export function MistakeTip({
  wordId,
  answer,
}: {
  wordId: string;
  answer: string;
}) {
  const [tip, setTip] = useState<{ for: string; text: string | null }>();
  const key = `${wordId}:${answer}`;

  useEffect(() => {
    let live = true;
    getMistakeTip(wordId, answer).then(
      (text) => live && setTip({ for: key, text }),
      () => live && setTip({ for: key, text: null }),
    );
    return () => {
      live = false;
    };
  }, [wordId, answer, key]);

  const ready = tip?.for === key;
  if (ready && !tip.text) return null;
  return (
    <p className="flex min-h-10 items-start gap-2 text-sm" aria-busy={!ready}>
      <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      {ready ? (
        tip.text
      ) : (
        <span className="text-muted-foreground">Getting a tip…</span>
      )}
    </p>
  );
}
