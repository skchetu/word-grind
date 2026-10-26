import Link from "next/link";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  formatDay,
  HOUSEHOLD_TIME_ZONE,
  todayIn,
  weekStart,
} from "@/lib/week/dates";
import { pendingTests, testDay } from "@/lib/week/pending-tests";

const weeksSchema = z.array(
  z
    .object({ id: z.string(), starts_on: z.string() })
    .transform((w) => ({ id: w.id, startsOn: w.starts_on })),
);
const takenSchema = z.array(z.object({ week_id: z.string() }));

// Every test the signed-in person can take now: today's on a Sunday, plus
// any missed ones as make-ups. Renders nothing when none are waiting.
export async function PendingTestsBanner() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  // RLS limits weeks to the household and sessions to what members can see.
  const today = todayIn(HOUSEHOLD_TIME_ZONE);
  const [{ data: weeks }, { data: taken }] = await Promise.all([
    supabase
      .from("weeks")
      .select("id, starts_on")
      .lte("starts_on", weekStart(today)),
    supabase
      .from("sessions")
      .select("week_id")
      .eq("profile_id", userId)
      .eq("kind", "test"),
  ]);
  const pending = pendingTests(
    weeksSchema.parse(weeks ?? []),
    new Set(takenSchema.parse(taken ?? []).map((s) => s.week_id)),
    today,
  );
  if (pending.length === 0) return null;

  return (
    <section
      aria-label="Tests to take"
      className="w-full rounded-lg border border-primary/40 bg-primary/5 p-4 text-left"
    >
      <h2 className="font-semibold">
        {pending.length === 1
          ? "A test is waiting for you"
          : `${pending.length} tests are waiting for you`}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {pending.map((week) => (
          <li key={week.id} className="flex items-center justify-between gap-3">
            <span className="text-sm">
              {testDay(week.startsOn) === today
                ? "Today's test"
                : `Missed test from ${formatDay(testDay(week.startsOn))}`}
            </span>
            <Button asChild size="sm">
              <Link href={`/test/${week.startsOn}`}>Take it</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
