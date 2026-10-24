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

// A test is scored against its week's whole list, in list order. Answers
// for other words are dropped, a repeated word keeps its first answer, and
// a word with no answer counts as missed, so a short or padded submission
// can't change the score. Tests have no hints.
export function testAnswers(
  answers: Answer[],
  weekWordIds: readonly string[],
): Answer[] {
  const byWord = new Map<string, Answer>();
  for (const a of answers) if (!byWord.has(a.wordId)) byWord.set(a.wordId, a);
  return weekWordIds.map((wordId) => ({
    ...(byWord.get(wordId) ?? { wordId, typed: "", ms: 0 }),
    hintUsed: false,
  }));
}

// The rows a finished drill or test writes: its score, one attempt per answer, and
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
