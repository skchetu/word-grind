import { z } from "zod";

import type { DrillWord } from "@/data/seed-words";
import { newestSentence, sentenceForTurn } from "@/lib/sentences/keep";
import { audioUrl } from "@/lib/speech/audio-url";

const wordSchema = z.object({
  id: z.string(),
  text: z.string(),
  definition: z.string(),
  audio_path: z.string().nullable(),
  word_sentences: z.array(
    z.object({
      id: z.string(),
      sentence: z.string(),
      cloze: z.string(),
      audio_path: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});
const weekWordsSchema = z.array(
  z.object({ position: z.int(), words: wordSchema }),
);
const dueRowsSchema = z.array(
  z.object({ word_id: z.string(), due_on: z.string(), words: wordSchema }),
);

// The columns a drill needs from `words`, for use in a Supabase select.
export const DRILL_WORD_COLUMNS =
  "id, text, definition, audio_path, word_sentences(id, sentence, cloze, audio_path, created_at)";

// `turns` says how many times the person has seen each word, so each
// appearance plays the word's next sentence. Without it, the newest plays.
export type Turns = Map<string, number>;

function toDrillWord(
  w: z.infer<typeof wordSchema>,
  supabaseUrl?: string,
  turns?: Turns,
): DrillWord {
  const sentences = w.word_sentences.map((s) => ({
    ...s,
    createdAt: s.created_at,
  }));
  const sentence = turns
    ? sentenceForTurn(sentences, turns.get(w.id) ?? 0)
    : newestSentence(sentences);
  return {
    id: w.id,
    text: w.text,
    definition: w.definition,
    audioUrl: audioUrl(w.audio_path, supabaseUrl),
    sentence: sentence && {
      text: sentence.sentence,
      cloze: sentence.cloze,
      audioUrl: audioUrl(sentence.audio_path, supabaseUrl),
    },
  };
}

// This week's words in list order, with each recorded clip's URL.
export function toDrillWords(
  weekWords: unknown,
  supabaseUrl?: string,
  turns?: Turns,
): DrillWord[] {
  return weekWordsSchema
    .parse(weekWords)
    .toSorted((a, b) => a.position - b.position)
    .map(({ words: w }) => toDrillWord(w, supabaseUrl, turns));
}

// The ids of a week's words, in no particular order.
export function weekWordIds(weekWords: unknown): string[] {
  return weekWordsSchema.parse(weekWords).map(({ words: w }) => w.id);
}

// Someone's review_state rows, as every word they've reviewed and the ones
// due by `today`.
export function toReviews(
  rows: unknown,
  today: string,
  supabaseUrl?: string,
  turns?: Turns,
) {
  const parsed = dueRowsSchema.parse(rows);
  return {
    reviewed: new Set(parsed.map((r) => r.word_id)),
    due: parsed
      .filter((r) => r.due_on <= today)
      .map((r) => ({
        word: toDrillWord(r.words, supabaseUrl, turns),
        dueOn: r.due_on,
      })),
  };
}
