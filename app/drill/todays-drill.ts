import { z } from "zod";

import type { DrillWord } from "@/data/seed-words";
import { pickDrillWords } from "@/lib/srs/pick";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import {
  DRILL_WORD_COLUMNS,
  toDrillWords,
  toReviews,
} from "@/lib/week/drill-words";

// The signed-in person's drill for today: words due for review plus this
// week's new words. Null until the household has a list for this week.
export async function todaysDrill(): Promise<{
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

  const { due, reviewed } = toReviews(reviews ?? [], today);
  return {
    weekId: z.uuid().parse(week.id),
    words: pickDrillWords(due, toDrillWords(week.week_words), reviewed),
  };
}
