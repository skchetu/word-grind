import { z } from "zod";

import type { WordCard } from "./machine";

// Where a drill in progress is kept, so leaving midway (a tab, Home, or a
// refresh) doesn't lose the answers given so far.
export const PROGRESS_KEY = "word-grind:drill-progress";

const resultSchema = z.object({
  wordId: z.string(),
  answer: z.string(),
  correct: z.boolean(),
  distance: z.number(),
  soClose: z.boolean(),
  hintUsed: z.boolean(),
});

const progressSchema = z.object({
  day: z.string(),
  wordIds: z.array(z.string()),
  results: z.array(resultSchema),
  answerMs: z.array(z.number()),
});

export type DrillProgress = z.infer<typeof progressSchema>;

// The saved answers to carry on from, or null to start fresh: progress from
// another day, or for a different set of words, doesn't apply.
export function savedProgress(
  raw: string | null,
  day: string,
  words: WordCard[],
): Pick<DrillProgress, "results" | "answerMs"> | null {
  if (!raw) return null;
  let parsed;
  try {
    parsed = progressSchema.safeParse(JSON.parse(raw));
  } catch {
    return null;
  }
  if (!parsed.success) return null;
  const { data } = parsed;
  const sameWords =
    data.day === day &&
    data.wordIds.length === words.length &&
    data.wordIds.every((id, i) => id === words[i]?.id) &&
    data.results.length < words.length &&
    data.results.every((r, i) => r.wordId === words[i]?.id);
  return sameWords && data.results.length > 0
    ? { results: data.results, answerMs: data.answerMs }
    : null;
}
