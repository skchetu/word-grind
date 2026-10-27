import { z } from "zod";

import type { DrillWord } from "@/data/seed-words";
import { pickDrillWords } from "@/lib/srs/pick";
import type { WordWithSentences } from "@/lib/sentences/refresh";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import {
  DRILL_WORD_COLUMNS,
  toDrillWords,
  toReviews,
} from "@/lib/week/drill-words";

import { addFreshSentences } from "./fresh-sentences";

// Just enough of a review row to find the returning words. Loose, so the
// columns toReviews needs pass through untouched.
const reviewRowsSchema = z.array(
  z.looseObject({
    due_on: z.string(),
    words: z.looseObject({
      id: z.string(),
      text: z.string(),
      word_sentences: z.array(
        z.looseObject({
          id: z.string(),
          sentence: z.string(),
          audio_path: z.string().nullable(),
          created_at: z.string(),
        }),
      ),
    }),
  }),
);

// The signed-in person's drill for today: words due for review plus this
// week's new words. Null until the household has a list for this week.
// With `freshSentences`, each returning word first gets a new example
// sentence; the home page's summary skips that so it never calls Claude.
export async function todaysDrill({ freshSentences = false } = {}): Promise<{
  weekId: string;
  words: DrillWord[];
} | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const today = todayIn(HOUSEHOLD_TIME_ZONE);

  const [{ data: week }, { data: reviews }] = await Promise.all([
    supabase
      .from("weeks")
      .select(`id, week_words(position, words(${DRILL_WORD_COLUMNS}))`)
      .eq("starts_on", weekStart(today))
      .maybeSingle(),
    supabase
      .from("review_state")
      .select(`word_id, due_on, words(${DRILL_WORD_COLUMNS})`)
      .eq("profile_id", auth?.claims.sub ?? ""),
  ]);
  if (!week) return null;

  const rows = reviewRowsSchema.parse(reviews ?? []);
  const userId = auth?.claims.sub;
  if (freshSentences && userId) {
    const returning: WordWithSentences[] = rows
      .filter((r) => r.due_on <= today)
      .map((r) => r.words);
    const added = await addFreshSentences(supabase, userId, returning, today);
    for (const word of returning) {
      const sentence = added.get(word.id);
      if (sentence) word.word_sentences.push(sentence);
    }
  }

  const { due, reviewed } = toReviews(rows, today);
  return {
    weekId: z.uuid().parse(week.id),
    words: pickDrillWords(due, toDrillWords(week.week_words), reviewed),
  };
}
