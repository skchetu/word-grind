import { redirect } from "next/navigation";
import { z } from "zod";

import { chartWeeks } from "@/lib/scoreboard/chart";
import { weeklyScores } from "@/lib/scoreboard/weekly";
import { createClient } from "@/lib/supabase/server";
import {
  formatDay,
  HOUSEHOLD_TIME_ZONE,
  todayIn,
  weekStart,
} from "@/lib/week/dates";

import { ScoreChart } from "./score-chart";

const weeksSchema = z.array(
  z
    .object({ id: z.string(), starts_on: z.string() })
    .transform((w) => ({ id: w.id, startsOn: w.starts_on })),
);
const peopleSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);
const testsSchema = z.array(
  z
    .object({
      profile_id: z.string(),
      week_id: z.string(),
      score: z.int(),
      total: z.int(),
      finished_at: z.string(),
    })
    .transform((t) => ({
      profileId: t.profile_id,
      weekId: t.week_id,
      score: t.score,
      total: t.total,
      finishedAt: t.finished_at,
    })),
);

// Each week's Sunday test score for everyone in the household, newest week
// first, with make-ups marked late. You're listed first.
export async function WeeklyScores() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  // RLS limits all three reads to the caller's household.
  const today = todayIn(HOUSEHOLD_TIME_ZONE);
  const [{ data: weeks }, { data: people }, { data: tests }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, starts_on")
        .lte("starts_on", weekStart(today)),
      supabase.from("profiles").select("id, display_name"),
      supabase
        .from("sessions")
        .select("profile_id, week_id, score, total, finished_at")
        .eq("kind", "test")
        .not("finished_at", "is", null),
    ]);

  const rows = weeklyScores(
    weeksSchema.parse(weeks ?? []),
    testsSchema.parse(tests ?? []),
    today,
    HOUSEHOLD_TIME_ZONE,
  );
  if (rows.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Scores show up here after the first Sunday test.
      </p>
    );
  }
  const members = peopleSchema
    .parse(people ?? [])
    .toSorted((a, b) => Number(b.id === userId) - Number(a.id === userId));

  return (
    <>
      <ScoreChart
        weeks={chartWeeks(
          rows,
          members.map((m) => m.id),
        )}
        members={members.map((m) => ({
          id: m.id,
          label: m.id === userId ? "You" : m.display_name,
        }))}
      />
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 font-medium">Week of</th>
            {members.map((m) => (
              <th key={m.id} className="py-2 pl-4 text-right font-medium">
                {m.id === userId ? "You" : m.display_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((week) => (
            <tr key={week.id} className="border-b last:border-0">
              <td className="py-3">{formatDay(week.startsOn, false)}</td>
              {members.map((m) => {
                const result = week.results[m.id];
                return (
                  <td key={m.id} className="py-3 pl-4 text-right tabular-nums">
                    {result ? (
                      <>
                        {result.score} / {result.total}
                        {result.late && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (late)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not yet</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
