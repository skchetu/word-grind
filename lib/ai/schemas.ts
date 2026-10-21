import { z } from "zod";

// One word as Claude returns it for the weekly list.
export const wordCardSchema = z.object({
  // Case and stray spaces are fixed rather than rejected, so "Rhythm "
  // doesn't cost a retry. Hyphens, spaces and accents still fail.
  word: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]+$/, "a single word, letters only"),
  partOfSpeech: z.string().min(1),
  definition: z.string().min(1),
  ipa: z.string().min(1),
  syllables: z.array(z.string().min(1)).min(1),
  origin: z.string().min(1),
  mnemonic: z.string().min(1), // short spelling memory hint
  difficulty: z.int().min(1).max(5),
  sentences: z.array(z.string().min(1)).length(2), // each must use the word
});
export type WordCardOutput = z.infer<typeof wordCardSchema>;

export const MIN_WORDS = 12;
export const MAX_WORDS = 15;

export const weekSchema = z.object({
  theme: z.string().min(1), // e.g. "Tricky doubles"
  words: z.array(wordCardSchema).min(MIN_WORDS).max(MAX_WORDS),
});
export type WeekOutput = z.infer<typeof weekSchema>;

const BLANK = "______";

// The word as a whole word, in any case: "Ephemeral" matches, but
// "ephemerally" doesn't.
function wholeWord(word: string): RegExp {
  return new RegExp(`\\b${word}\\b`, "gi");
}

// The fill-in-the-blank version of a sentence, or null when the sentence
// doesn't use the word. Built in code rather than trusting the model to
// blank the word out correctly.
export function toCloze(sentence: string, word: string): string | null {
  const pattern = wholeWord(word);
  if (!pattern.test(sentence)) return null;
  return sentence.replace(pattern, BLANK);
}

// Rules the schema can't express. Returns a list of problems, empty when
// the week is usable.
export function checkWeek(week: WeekOutput): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const card of week.words) {
    if (seen.has(card.word)) problems.push(`"${card.word}" appears twice`);
    seen.add(card.word);

    if (card.syllables.join("").toLowerCase() !== card.word) {
      problems.push(`"${card.word}" syllables don't spell the word`);
    }

    card.sentences.forEach((sentence, i) => {
      if (toCloze(sentence, card.word) === null) {
        problems.push(`"${card.word}" sentence ${i + 1} doesn't use the word`);
      }
    });
  }

  return problems;
}
