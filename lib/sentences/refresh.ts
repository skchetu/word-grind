import { SENTENCES_PER_WORD } from "@/lib/ai/schemas";

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

// The words with fewer than SENTENCES_PER_WORD sentences, which still need
// one topped up. New lists come with three; backup-list words and words
// saved before then have two.
export function wordsNeedingSentence<T extends WordWithSentences>(
  words: T[],
): T[] {
  return words.filter((w) => w.word_sentences.length < SENTENCES_PER_WORD);
}
