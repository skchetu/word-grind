import { z } from "zod";

import { grade } from "@/lib/grading/grade";
import { initialState, schedule, type ReviewState } from "@/lib/srs/schedule";

// One answer as the drill screen sends it. Grading happens again on the
// server, so the client only reports what was typed.
export const answerSchema = z.object({
  wordId: z.uuid(),
  typed: z.string().max(60),
  hintUsed: z.boolean(),
  ms: z.int().min(0),
});
export type Answer = z.infer<typeof answerSchema>;

// Longest time recorded for one answer (an hour), so a tab left open
// overnight doesn't skew "time to answer" stats.
const MAX_MS = 60 * 60 * 1000;

// The rows a finished drill writes: its score, one attempt per answer, and
// each word's next Leitner box. Answers for words that aren't in `texts`
// are dropped. `states` holds the speller's current review_state per word.
export function drillRecords(
  answers: Answer[],
  texts: ReadonlyMap<string, string>,
  states: ReadonlyMap<string, ReviewState>,
  today: string,
) {
  const graded = answers.flatMap((a) => {
    const text = texts.get(a.wordId);
    return text === undefined ? [] : [{ ...a, ...grade(a.typed, text) }];
  });
  return {
    score: graded.filter((g) => g.correct).length,
    total: graded.length,
    attempts: graded.map((g) => ({
      word_id: g.wordId,
      typed: g.typed,
      correct: g.correct,
      edit_distance: g.distance,
      used_hint: g.hintUsed,
      ms_to_answer: Math.min(g.ms, MAX_MS),
    })),
    reviews: graded.map((g) => {
      const next = schedule(
        states.get(g.wordId) ?? initialState(today),
        g.correct,
        today,
      );
      return {
        word_id: g.wordId,
        box: next.box,
        due_on: next.dueOn,
        correct_streak: next.correctStreak,
        lapses: next.lapses,
      };
    }),
  };
}
