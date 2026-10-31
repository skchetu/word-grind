import { BasicDrill } from "@/components/session/basic-drill";
import { randomTurns } from "@/lib/sentences/turns";
import { shuffle } from "@/lib/session/shuffle";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import {
  DRILL_WORD_COLUMNS,
  toDrillWords,
  weekWordIds,
} from "@/lib/week/drill-words";

// This week's whole list in a fresh random order on every visit. Practice
// isn't saved, so it never moves a word's review date or a score.
export async function WeekPractice() {
  const supabase = await createClient();
  const { data: week } = await supabase
    .from("weeks")
    .select(`week_words(position, words(${DRILL_WORD_COLUMNS}))`)
    .eq("starts_on", weekStart(todayIn(HOUSEHOLD_TIME_ZONE)))
    .maybeSingle();
  if (!week) {
    return (
      <p className="text-muted-foreground">
        There&apos;s no list for this week yet.
      </p>
    );
  }
  // Each word plays one of its sentences at random.
  const turns = randomTurns(weekWordIds(week.week_words));
  return (
    <BasicDrill
      words={shuffle(toDrillWords(week.week_words, undefined, turns))}
      practice
    />
  );
}
