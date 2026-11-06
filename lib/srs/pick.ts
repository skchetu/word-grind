// Words in every daily drill, as long as there are that many to ask.
export const DRILL_SIZE = 10;

// Today's drill: words due for review first (most overdue first), then this
// week's words that haven't been reviewed yet, then, if that's still short
// of DRILL_SIZE, the words due soonest after today. Reviewing those a little
// early keeps every drill the same length while the word bank is still small.
export function pickDrillWords<T extends { id: string }>(
  due: { word: T; dueOn: string }[],
  weekWords: T[],
  reviewed: ReadonlySet<string>,
  upcoming: { word: T; dueOn: string }[] = [],
  size = DRILL_SIZE,
): T[] {
  const byDate = (words: { word: T; dueOn: string }[]) =>
    words.toSorted((a, b) => a.dueOn.localeCompare(b.dueOn)).map((d) => d.word);
  const unseen = weekWords.filter((w) => !reviewed.has(w.id));
  return [...byDate(due), ...unseen, ...byDate(upcoming)].slice(0, size);
}

// Seconds a typical answer takes: listen, type, read the feedback.
const SECONDS_PER_WORD = 20;

// Rough minutes a drill of `words` words takes, at least one.
export function drillMinutes(words: number): number {
  return Math.max(1, Math.round((words * SECONDS_PER_WORD) / 60));
}
