import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { SessionResults } from "@/components/session/session-results";
import { Button } from "@/components/ui/button";
import {
  ATTEMPT_COLUMNS,
  savedAttemptsSchema,
} from "@/lib/session/saved-results";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

const lastDrillSchema = z
  .object({ finished_at: z.string(), attempts: savedAttemptsSchema })
  .nullable();

// The full results of the signed-in person's drill, if they finished one
// today (household time zone), so they can come back to them from Home.
export async function TodaysResults() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("sessions")
    .select(`finished_at, attempts(${ATTEMPT_COLUMNS})`)
    .eq("profile_id", userId)
    .eq("kind", "drill")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const drill = lastDrillSchema.parse(data);
  const today = todayIn(HOUSEHOLD_TIME_ZONE);

  if (
    !drill ||
    drill.attempts.results.length === 0 ||
    todayIn(HOUSEHOLD_TIME_ZONE, new Date(drill.finished_at)) !== today
  ) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          You haven&apos;t finished a drill today.
        </p>
        <Button asChild>
          <Link href="/drill">Start today&apos;s drill</Link>
        </Button>
      </div>
    );
  }

  return (
    <SessionResults
      words={drill.attempts.words}
      results={drill.attempts.results}
      saveFailed={false}
      mode="drill"
    />
  );
}
