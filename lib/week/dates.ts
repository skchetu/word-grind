import { addDays } from "@/lib/srs/schedule";

// Weeks start on Monday in the household's time zone, so "this week" is the
// same list for both people no matter where the server runs.
export const HOUSEHOLD_TIME_ZONE = "America/Los_Angeles";

// Today's date ("2026-10-21") in the given time zone. The en-CA locale
// formats dates as YYYY-MM-DD.
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

// The Monday on or before the given date.
export function weekStart(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 is Sunday
  return addDays(date, -((day + 6) % 7));
}

// A date ("2026-10-25") for display, such as "Sunday, Oct 25", or "Oct 25"
// without the weekday. Formatted in
// UTC so the calendar date never shifts.
export function formatDay(date: string, weekday = true): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: weekday ? "long" : undefined,
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}
