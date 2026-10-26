import { addDays } from "@/lib/srs/schedule";

import { weekStart } from "./dates";

export type WeekRef = { id: string; startsOn: string };

// The Sunday a week's test opens: six days after its Monday.
export function testDay(startsOn: string): string {
  return addDays(startsOn, 6);
}

// The weeks whose test is open and not yet taken, oldest first. A test
// opens on its week's Sunday and stays open until it's taken, so a missed
// Sunday becomes a make-up test. `taken` holds the week ids of tests the
// person has already finished.
export function pendingTests(
  weeks: readonly WeekRef[],
  taken: ReadonlySet<string>,
  today: string,
): WeekRef[] {
  return weeks
    .filter((w) => testDay(w.startsOn) <= today && !taken.has(w.id))
    .toSorted((a, b) => a.startsOn.localeCompare(b.startsOn));
}

// A note on when this week's test opens, or null on Sunday itself, when
// the test is already open.
export function testCountdown(today: string): string | null {
  const days =
    (Date.parse(testDay(weekStart(today))) - Date.parse(today)) / 86_400_000;
  if (days === 0) return null;
  return days === 1
    ? "Sunday test opens tomorrow"
    : `Sunday test opens in ${days} days`;
}
