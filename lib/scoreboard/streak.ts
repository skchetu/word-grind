import { addDays } from "@/lib/srs/schedule";

// Days in a row with at least one finished drill or test, counting back
// from today. A streak that reached yesterday is still alive until today
// ends, so it isn't shown as broken before you've had a chance to practice.
// `practiced` holds dates ("2026-10-26") in the household's time zone.
export function currentStreak(
  practiced: ReadonlySet<string>,
  today: string,
): number {
  let day = practiced.has(today) ? today : addDays(today, -1);
  let days = 0;
  while (practiced.has(day)) {
    days++;
    day = addDays(day, -1);
  }
  return days;
}
