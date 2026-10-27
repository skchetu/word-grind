// The household's shared difficulty level, nudged once a week from the
// Sunday test. Everyone in a household gets the same list, so the level
// follows how the household did as a whole, not one person.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const DEFAULT_LEVEL = 3;

// Accuracy at or above this moves the level up; at or below DOWN_AT, down.
export const UP_AT = 0.85;
export const DOWN_AT = 0.6;

// Correct answers out of total, summed over everyone's Sunday test.
export type TestTally = { correct: number; total: number };

// Next week's level. With no answers (nobody took the test) the level
// stays put, so a skipped week isn't read as a bad one.
export function adaptDifficulty(current: number, tally: TestTally): number {
  if (tally.total <= 0) return clampLevel(current);

  const accuracy = tally.correct / tally.total;
  const step = accuracy >= UP_AT ? 1 : accuracy <= DOWN_AT ? -1 : 0;
  return clampLevel(current + step);
}

// Adds up each person's Sunday test into one household tally.
export function householdTally(tallies: TestTally[]): TestTally {
  return tallies.reduce(
    (sum, t) => ({
      correct: sum.correct + t.correct,
      total: sum.total + t.total,
    }),
    { correct: 0, total: 0 },
  );
}

export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

// How the level moved from one week to the next, for the recap. Weeks made
// before levels were recorded have no previous level.
export function levelChange(previous: number | null, next: number): string {
  const label = `Next week: level ${next}`;
  if (previous === null) return label;
  if (next > previous) return `${label} (up from ${previous})`;
  if (next < previous) return `${label} (down from ${previous})`;
  return `${label} (no change)`;
}
