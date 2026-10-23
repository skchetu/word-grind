import { z } from "zod";

import type { DrillWord } from "@/data/seed-words";
import { audioUrl } from "@/lib/speech/audio-url";

const weekWordsSchema = z.array(
  z.object({
    position: z.int(),
    words: z.object({
      id: z.string(),
      text: z.string(),
      definition: z.string(),
      audio_path: z.string().nullable(),
    }),
  }),
);

// This week's words in list order, with each recorded clip's URL.
export function toDrillWords(
  weekWords: unknown,
  supabaseUrl?: string,
): DrillWord[] {
  return weekWordsSchema
    .parse(weekWords)
    .toSorted((a, b) => a.position - b.position)
    .map(({ words: w }) => ({
      id: w.id,
      text: w.text,
      definition: w.definition,
      audioUrl: audioUrl(w.audio_path, supabaseUrl),
    }));
}
