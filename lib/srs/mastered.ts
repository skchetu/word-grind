import { MASTERED_BOX } from "./schedule";

export type BoxRow = { profileId: string; wordId: string; box: number };

// How many of `wordIds` each person has mastered (reached MASTERED_BOX).
export function masteredCounts(
  rows: readonly BoxRow[],
  wordIds: ReadonlySet<string>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { profileId, wordId, box } of rows) {
    if (box >= MASTERED_BOX && wordIds.has(wordId)) {
      counts.set(profileId, (counts.get(profileId) ?? 0) + 1);
    }
  }
  return counts;
}
