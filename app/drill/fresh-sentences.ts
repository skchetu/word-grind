import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { canCallClaude, logClaudeCall } from "@/lib/ai/calls";
import {
  generateSentences,
  SENTENCES_MODEL,
} from "@/lib/ai/generate-sentences";
import {
  wordsNeedingSentence,
  type WordWithSentences,
} from "@/lib/sentences/refresh";

const topicsSchema = z.array(z.object({ topics: z.array(z.string()) }));
const savedSchema = z.array(
  z.object({
    id: z.string(),
    word_id: z.string(),
    sentence: z.string(),
    cloze: z.string(),
    audio_path: z.string().nullable(),
    created_at: z.string(),
  }),
);

// Gives each word with fewer than three sentences one more from Claude, in
// one call. Returns the new sentences by word id. Any failure leaves the
// words as they were.
export async function addFreshSentences(
  supabase: SupabaseClient,
  userId: string,
  words: WordWithSentences[],
): Promise<Map<string, z.infer<typeof savedSchema>[number]>> {
  const added = new Map<string, z.infer<typeof savedSchema>[number]>();
  const needing = wordsNeedingSentence(words);
  if (needing.length === 0) return added;
  if (!(await canCallClaude(supabase, userId, "sentences"))) return added;

  // RLS limits profiles to the caller's household.
  const { data: members } = await supabase.from("profiles").select("topics");
  const topics = [
    ...new Set(topicsSchema.parse(members ?? []).flatMap((m) => m.topics)),
  ];

  const { sentences, usage } = await generateSentences({
    words: needing.map((w) => ({
      word: w.text,
      avoid: w.word_sentences.map((s) => s.sentence),
    })),
    topics,
  });
  await logClaudeCall(supabase, {
    userId,
    feature: "sentences",
    model: SENTENCES_MODEL,
    usage,
  });

  const rows = needing.flatMap((w) => {
    const fresh = sentences.get(w.text);
    return fresh ? [{ word_id: w.id, ...fresh }] : [];
  });
  if (rows.length === 0) return added;

  const { data, error } = await supabase
    .from("word_sentences")
    .insert(rows)
    .select("id, word_id, sentence, cloze, audio_path, created_at");
  if (error) {
    console.error("Saving new sentences failed:", error.message);
    return added;
  }
  for (const row of savedSchema.parse(data)) added.set(row.word_id, row);

  return added;
}

const weekWordsSchema = z.array(
  z.object({
    words: z.object({
      id: z.string(),
      text: z.string(),
      word_sentences: z.array(
        z.object({
          id: z.string(),
          sentence: z.string(),
          audio_path: z.string().nullable(),
          created_at: z.string(),
        }),
      ),
    }),
  }),
);

// Tops up a new week's words to three sentences each, so they're ready (and
// can be recorded) before anyone drills them.
export async function topUpWeekSentences(
  supabase: SupabaseClient,
  userId: string,
  weekId: string,
) {
  const { data, error } = await supabase
    .from("week_words")
    .select(
      "words(id, text, word_sentences(id, sentence, audio_path, created_at))",
    )
    .eq("week_id", weekId);
  if (error)
    throw new Error(`Loading the week's words failed: ${error.message}`);
  const words = weekWordsSchema.parse(data).map((row) => row.words);
  await addFreshSentences(supabase, userId, words);
}
