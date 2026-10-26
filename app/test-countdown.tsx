import { connection } from "next/server";

import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";
import { testCountdown } from "@/lib/week/pending-tests";

// When this week's Sunday test opens. On Sunday the pending tests banner
// takes over, so this renders nothing.
export async function TestCountdown() {
  // Today's date changes per request, so render at request time.
  await connection();
  const note = testCountdown(todayIn(HOUSEHOLD_TIME_ZONE));
  if (!note) return null;
  return <p className="text-sm text-muted-foreground">{note}</p>;
}
