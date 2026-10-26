import { addDays } from "@/lib/srs/schedule";

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
