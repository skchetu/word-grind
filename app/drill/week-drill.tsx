import { BasicDrill } from "@/components/session/basic-drill";
import { seedWords } from "@/data/seed-words";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import { toDrillWords } from "@/lib/week/drill-words";

// Drills this week's list, or the seed words until the household has one.
// Reads the session, so it renders per request behind a Suspense boundary.
export async function WeekDrill() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weeks")
    .select("week_words(position, words(id, text, definition, audio_path))")
    .eq("starts_on", weekStart(todayIn(HOUSEHOLD_TIME_ZONE)))
    .maybeSingle();

  const words = data ? toDrillWords(data.week_words) : [];
  return <BasicDrill words={words.length > 0 ? words : seedWords} />;
}
