import { todayIn } from "@/lib/week/dates";
import { testDay, type WeekRef } from "@/lib/week/pending-tests";

export type TestResult = {
  profileId: string;
  weekId: string;
  score: number;
  total: number;
  finishedAt: string; // ISO timestamp
};
export type WeekScores = WeekRef & {
  // Keyed by profile id; a person who hasn't taken the test has no entry.
  results: Record<string, { score: number; total: number; late: boolean }>;
};

// One scoreboard row per week whose test has opened, newest first. A test
// finished after its week's Sunday (in the household's time zone) is a
// make-up and counts as late.
export function weeklyScores(
  weeks: readonly WeekRef[],
  tests: readonly TestResult[],
  today: string,
  timeZone: string,
): WeekScores[] {
  return weeks
    .filter((w) => testDay(w.startsOn) <= today)
    .toSorted((a, b) => b.startsOn.localeCompare(a.startsOn))
    .map((week) => {
      const results: WeekScores["results"] = {};
      for (const t of tests) {
        if (t.weekId !== week.id) continue;
        const day = todayIn(timeZone, new Date(t.finishedAt));
        results[t.profileId] = {
          score: t.score,
          total: t.total,
          late: day > testDay(week.startsOn),
        };
      }
      return { ...week, results };
    });
}
