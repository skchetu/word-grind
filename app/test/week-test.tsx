import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";

import { BasicDrill } from "@/components/session/basic-drill";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  formatDay,
  HOUSEHOLD_TIME_ZONE,
  todayIn,
  weekStart,
} from "@/lib/week/dates";
import { DRILL_WORD_COLUMNS, toDrillWords } from "@/lib/week/drill-words";
import { testDay } from "@/lib/week/pending-tests";

const takenSchema = z.object({ score: z.int(), total: z.int() }).nullable();

// One week's test: every word on that week's list, in list order. With no
// `startsOn` it's this week's. A test opens on its week's Sunday and stays
// open as a make-up until it's taken; each person takes it once.
export async function WeekTest({ startsOn }: { startsOn?: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  // Read after the session, so the date is taken per request.
  const today = todayIn(HOUSEHOLD_TIME_ZONE);
  const monday = startsOn ?? weekStart(today);
  if (weekStart(monday) !== monday) notFound();

  const { data: week } = await supabase
    .from("weeks")
    .select(`id, week_words(position, words(${DRILL_WORD_COLUMNS}))`)
    .eq("starts_on", monday)
    .maybeSingle();
  if (!week) return <Notice>There&apos;s no list for that week.</Notice>;

  const sunday = testDay(monday);
  if (today < sunday) {
    return <Notice>This test opens on {formatDay(sunday)}.</Notice>;
  }

  const weekId = z.uuid().parse(week.id);
  const { data: session } = await supabase
    .from("sessions")
    .select("score, total")
    .eq("profile_id", userId)
    .eq("week_id", weekId)
    .eq("kind", "test")
    .maybeSingle();
  const taken = takenSchema.parse(session);
  if (taken) {
    return (
      <Notice>
        You&apos;ve taken this test: {taken.score} / {taken.total} correct.
      </Notice>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        {today === sunday ? "Today's test" : "Make-up test"} for the week of{" "}
        {formatDay(monday)}
      </p>
      <BasicDrill
        mode="test"
        weekId={weekId}
        words={toDrillWords(week.week_words)}
      />
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-muted-foreground">{children}</p>
      <Button asChild variant="outline">
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
