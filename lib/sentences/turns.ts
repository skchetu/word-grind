import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { SENTENCES_PER_WORD } from "@/lib/ai/schemas";

const answersSchema = z.array(z.object({ word_id: z.string() }));

// How many times someone has answered each of these words in a saved drill
// or test, which picks the sentence they hear next. A failed read counts as
// none, so the first sentence plays.
export async function answerCounts(
  supabase: SupabaseClient,
  userId: string,
  wordIds: string[],
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("attempts")
    .select("word_id, sessions!inner(profile_id)")
    .eq("sessions.profile_id", userId)
    .in("word_id", wordIds);
  if (error) console.error("Counting answers failed:", error.message);
  const counts = new Map<string, number>();
  for (const { word_id } of answersSchema.parse(data ?? [])) {
    counts.set(word_id, (counts.get(word_id) ?? 0) + 1);
  }
  return counts;
}

// A random turn for each word, for practice, which isn't saved and so has no
// count to cycle by. `random` is injectable for tests.
export function randomTurns(
  wordIds: string[],
  random = Math.random,
): Map<string, number> {
  return new Map(
    wordIds.map((id) => [id, Math.floor(random() * SENTENCES_PER_WORD)]),
  );
}
