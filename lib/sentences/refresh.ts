import { todayIn } from "@/lib/week/dates";

import { newestSentence } from "./keep";

// A word as the drill loads it, with its saved sentences.
export type WordWithSentences = {
  id: string;
  text: string;
  word_sentences: {
    id: string;
    sentence: string;
    audio_path: string | null;
    created_at: string;
  }[];
};

// The returning words that haven't been given a new sentence yet today, in
// the household's time zone. Once a word has one, reloading the drill or the
// other person's drill reuses it instead of calling Claude again.
export function wordsNeedingSentence<T extends WordWithSentences>(
  words: T[],
  today: string,
  timeZone: string,
): T[] {
  return words.filter((word) => {
    const newest = newestSentence(
      word.word_sentences.map((s) => ({ id: s.id, createdAt: s.created_at })),
    );
    return !newest || todayIn(timeZone, new Date(newest.createdAt)) < today;
  });
}
