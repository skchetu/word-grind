import { toCloze, type WeekOutput } from "@/lib/ai/schemas";

// The shape public.save_week expects: each sentence paired with its
// fill-in-the-blank version. checkWeek has already made sure every
// sentence uses its word, so toCloze never returns null here.
export function toSavePayload(week: WeekOutput) {
  return {
    ...week,
    words: week.words.map((card) => ({
      ...card,
      sentences: card.sentences.map((sentence) => ({
        sentence,
        cloze: toCloze(sentence, card.word) ?? sentence,
      })),
    })),
  };
}
