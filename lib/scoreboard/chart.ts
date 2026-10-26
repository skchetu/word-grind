import type { WeekScores } from "./weekly";

export type ChartWeek = {
  id: string;
  startsOn: string;
  // One entry per member, in the order given: the score as a whole
  // percentage, or null when that person hasn't taken the test.
  percents: (number | null)[];
};

// The most recent `limit` weeks, oldest first so the chart reads left to
// right. Percentages let weeks of different list sizes share one axis.
export function chartWeeks(
  rows: readonly WeekScores[],
  memberIds: readonly string[],
  limit = 8,
): ChartWeek[] {
  return rows
    .slice(0, limit)
    .toReversed()
    .map((week) => ({
      id: week.id,
      startsOn: week.startsOn,
      percents: memberIds.map((id) => {
        const result = week.results[id];
        if (!result || result.total === 0) return null;
        return Math.round((result.score / result.total) * 100);
      }),
    }));
}
