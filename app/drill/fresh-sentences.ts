import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { canCallClaude, logClaudeCall } from "@/lib/ai/calls";
import {
  generateSentences,
  SENTENCES_MODEL,
} from "@/lib/ai/generate-sentences";
import { sentencesToPrune } from "@/lib/sentences/keep";
import {
  wordsNeedingSentence,
  type WordWithSentences,
} from "@/lib/sentences/refresh";
import { AUDIO_BUCKET } from "@/lib/speech/audio-url";
import { HOUSEHOLD_TIME_ZONE } from "@/lib/week/dates";

type Sentence = WordWithSentences["word_sentences"][number];

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

// Gives each returning word a new sentence from Claude, at most once a day,
// then deletes all but the word's newest three (and their clips). Returns
// the new sentences by word id, for the drill to show. Any failure leaves
// the words as they were, and the drill shows their newest saved sentence.
export async function addFreshSentences(
  supabase: SupabaseClient,
  userId: string,
  words: WordWithSentences[],
  today: string,
): Promise<Map<string, z.infer<typeof savedSchema>[number]>> {
  const added = new Map<string, z.infer<typeof savedSchema>[number]>();
  const needing = wordsNeedingSentence(words, today, HOUSEHOLD_TIME_ZONE);
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

  // Older sentences beyond the newest three, for the words that got one.
  const pruned: Sentence[] = needing.flatMap((w) => {
    const fresh = added.get(w.id);
    if (!fresh) return [];
    return sentencesToPrune(
      [...w.word_sentences, fresh].map((s) => ({
        ...s,
        createdAt: s.created_at,
      })),
    );
  });
  await prune(supabase, pruned);
  return added;
}

// Deletes the sentences, then their clips. A failure is only logged: the
// next refresh tries again, and the drill already shows the newest sentence.
async function prune(supabase: SupabaseClient, sentences: Sentence[]) {
  if (sentences.length === 0) return;
  const { error } = await supabase
    .from("word_sentences")
    .delete()
    .in(
      "id",
      sentences.map((s) => s.id),
    );
  if (error) {
    console.error("Pruning old sentences failed:", error.message);
    return;
  }
  const clips = sentences.flatMap((s) => (s.audio_path ? [s.audio_path] : []));
  if (clips.length === 0) return;
  const { error: clipError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .remove(clips);
  if (clipError) console.error("Removing old clips failed:", clipError.message);
}
