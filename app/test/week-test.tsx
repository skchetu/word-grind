import Link from "next/link";

import { BasicDrill } from "@/components/session/basic-drill";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import { DRILL_WORD_COLUMNS, toDrillWords } from "@/lib/week/drill-words";

// The Sunday test: every word on this week's list, in list order. Results
// aren't saved yet.
export async function WeekTest() {
  const supabase = await createClient();
  const { data: week } = await supabase
    .from("weeks")
    .select(`week_words(position, words(${DRILL_WORD_COLUMNS}))`)
    .eq("starts_on", weekStart(todayIn(HOUSEHOLD_TIME_ZONE)))
    .maybeSingle();

  if (!week) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">
          There&apos;s no list this week yet, so there&apos;s nothing to test.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    );
  }
  return <BasicDrill mode="test" words={toDrillWords(week.week_words)} />;
}
