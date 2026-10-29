import Link from "next/link";

import { CopyResult } from "@/components/session/copy-result";
import { Button } from "@/components/ui/button";
import type { Mode, Result, WordCard } from "@/lib/session/machine";
import { summarize } from "@/lib/session/summary";
import { cn } from "@/lib/utils";

// The end of a drill or test: the score, then every word with what was
// typed. Missed words come first.
export function SessionResults({
  words,
  results,
  saveFailed,
  mode,
  weekStartsOn,
}: {
  words: WordCard[];
  results: Result[];
  saveFailed: boolean;
  mode: Mode;
  weekStartsOn?: string;
}) {
  const { correct, total, rows } = summarize(results);
  const text = new Map(words.map((w) => [w.id, w.text]));
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-2xl font-semibold">
        {correct} / {total} correct
      </p>
      {saveFailed && (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t save these results.
        </p>
      )}
      <ul className="w-full divide-y rounded-lg border">
        {rows.map((r) => (
          <li
            key={r.wordId}
            className="flex items-baseline justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium break-words">{text.get(r.wordId)}</p>
              {!r.correct && (
                <p className="text-sm break-words text-muted-foreground">
                  You typed{" "}
                  <span className="font-mono text-danger">
                    {r.answer || "(nothing)"}
                  </span>
                </p>
              )}
            </div>
            <p
              className={cn(
                "shrink-0 text-sm",
                r.correct
                  ? "text-success"
                  : r.soClose
                    ? "text-warning"
                    : "text-danger",
              )}
            >
              {r.correct ? "Correct" : r.soClose ? "So close" : "Missed"}
              {r.hintUsed && " · hint"}
            </p>
          </li>
        ))}
      </ul>
      <CopyResult mode={mode} weekStartsOn={weekStartsOn} results={results} />
      <Button asChild variant="outline">
        <Link href="/">Done</Link>
      </Button>
    </div>
  );
}
