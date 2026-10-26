import { z } from "zod";

import { currentStreak } from "@/lib/scoreboard/streak";
import { addDays } from "@/lib/srs/schedule";
import type { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

const sessionsSchema = z.array(
  z.object({ profile_id: z.string(), finished_at: z.string() }),
);

// Everyone's daily practice streak in the household, by profile id. People
// with no streak are left out.
export async function loadStreaks(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, number>> {
  // RLS limits this to the household. A year of sessions is far more than
  // any streak needs before it reaches the first missed day.
  const today = todayIn(HOUSEHOLD_TIME_ZONE);
  const { data: sessions } = await supabase
    .from("sessions")
    .select("profile_id, finished_at")
    .not("finished_at", "is", null)
    .gte("finished_at", addDays(today, -366));

  const practised = new Map<string, Set<string>>();
  for (const s of sessionsSchema.parse(sessions ?? [])) {
    const days = practised.get(s.profile_id) ?? new Set<string>();
    days.add(todayIn(HOUSEHOLD_TIME_ZONE, new Date(s.finished_at)));
    practised.set(s.profile_id, days);
  }
  return new Map(
    [...practised].map(([id, days]) => [id, currentStreak(days, today)]),
  );
}
