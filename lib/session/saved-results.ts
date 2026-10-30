import { z } from "zod";

import type { Result, WordCard } from "./machine";

// The attempt columns (and each word's text) that rebuild a finished
// session's results screen.
export const ATTEMPT_COLUMNS =
  "word_id, typed, correct, edit_distance, used_hint, words(text)";

// Saved attempts as the results screen takes them. One letter off counts as
// so close, as when grading.
export const savedAttemptsSchema = z
  .array(
    z.object({
      word_id: z.string(),
      typed: z.string(),
      correct: z.boolean(),
      edit_distance: z.int(),
      used_hint: z.boolean(),
      words: z.object({ text: z.string() }),
    }),
  )
  .transform((attempts) => ({
    words: attempts.map(
      (a): WordCard => ({ id: a.word_id, text: a.words.text }),
    ),
    results: attempts.map(
      (a): Result => ({
        wordId: a.word_id,
        answer: a.typed,
        correct: a.correct,
        distance: a.edit_distance,
        soClose: !a.correct && a.edit_distance === 1,
        hintUsed: a.used_hint,
      }),
    ),
  }));
