import Link from "next/link";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDay, HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

const lastTestSchema = z
  .object({
    score: z.int(),
    total: z.int(),
    finished_at: z.string(),
    weeks: z.object({ starts_on: z.string() }),
  })
  .nullable();

// The signed-in person's most recent finished test, with a link to its full
// results. Home shows it in the test spot while no test is waiting, and
// nothing before the first test.
export async function LastTestCard({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("score, total, finished_at, weeks(starts_on)")
    .eq("profile_id", userId)
    .eq("kind", "test")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const test = lastTestSchema.parse(data);
  if (!test) return null;

  const takenOn = todayIn(HOUSEHOLD_TIME_ZONE, new Date(test.finished_at));
  return (
    <section
      aria-labelledby="last-test-heading"
      className="w-full rounded-lg border p-4 text-left"
    >
      <h2 id="last-test-heading" className="font-semibold">
        Last test
      </h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm">
          <p className="text-muted-foreground">Taken on {formatDay(takenOn)}</p>
          <p>
            Score: {test.score} / {test.total}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/test/${test.weeks.starts_on}`}>See results</Link>
        </Button>
      </div>
    </section>
  );
}
