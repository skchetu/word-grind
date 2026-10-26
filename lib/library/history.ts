import { todayIn } from "@/lib/week/dates";

export type AttemptRow = {
  typed: string;
  correct: boolean;
  createdAt: string;
  kind: "drill" | "test";
};
export type HistoryEntry = Omit<AttemptRow, "createdAt"> & { day: string };

// Someone's answers for one word, newest first, each dated in the
// household's time zone.
export function attemptHistory(
  rows: readonly AttemptRow[],
  timeZone: string,
): HistoryEntry[] {
  return rows
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ createdAt, ...rest }) => ({
      ...rest,
      day: todayIn(timeZone, new Date(createdAt)),
    }));
}
