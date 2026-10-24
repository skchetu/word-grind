import Link from "next/link";
import { z } from "zod";

import { BasicDrill } from "@/components/session/basic-drill";
import { Button } from "@/components/ui/button";
import { seedWords } from "@/data/seed-words";
import { pickDrillWords } from "@/lib/srs/pick";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import {
  DRILL_WORD_COLUMNS,
  toDrillWords,
  toReviews,
} from "@/lib/week/drill-words";

// Today's drill: words due for review plus this week's new words. Uses the
// seed words until the household has a list. Reads the session, so it
// renders per request behind a Suspense boundary.
export async function WeekDrill() {
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
  if (!week) return <BasicDrill words={seedWords} />;

  const { due, reviewed } = toReviews(reviews ?? [], today);
  const words = pickDrillWords(due, toDrillWords(week.week_words), reviewed);
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">
          No words due today. Come back tomorrow.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    );
  }
  return <BasicDrill words={words} weekId={z.uuid().parse(week.id)} />;
}
