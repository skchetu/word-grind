// Most words a daily drill asks, so a backlog never turns into a chore.
export const DRILL_CAP = 15;

// Today's drill: words due for review first (most overdue first), then this
// week's words that haven't been reviewed yet, up to the cap.
export function pickDrillWords<T extends { id: string }>(
  due: { word: T; dueOn: string }[],
  weekWords: T[],
  reviewed: ReadonlySet<string>,
  cap = DRILL_CAP,
): T[] {
  const overdueFirst = due
    .toSorted((a, b) => a.dueOn.localeCompare(b.dueOn))
    .map((d) => d.word);
  const unseen = weekWords.filter((w) => !reviewed.has(w.id));
  return [...overdueFirst, ...unseen].slice(0, cap);
}

// Seconds a typical answer takes: listen, type, read the feedback.
const SECONDS_PER_WORD = 20;

// Rough minutes a drill of `words` words takes, at least one.
export function drillMinutes(words: number): number {
  return Math.max(1, Math.round((words * SECONDS_PER_WORD) / 60));
}
