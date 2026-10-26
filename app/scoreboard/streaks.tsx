import { redirect } from "next/navigation";
import { z } from "zod";

import { currentStreak } from "@/lib/scoreboard/streak";
import { addDays } from "@/lib/srs/schedule";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

const peopleSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);
const sessionsSchema = z.array(
  z.object({ profile_id: z.string(), finished_at: z.string() }),
);

// Each person's daily practice streak, you first.
export async function Streaks() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  // RLS limits both reads to the household. A year of sessions is far more
  // than any streak needs before it reaches the first missed day.
  const today = todayIn(HOUSEHOLD_TIME_ZONE);
  const [{ data: people }, { data: sessions }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("sessions")
      .select("profile_id, finished_at")
      .not("finished_at", "is", null)
      .gte("finished_at", addDays(today, -366)),
  ]);

  const practised = new Map<string, Set<string>>();
  for (const s of sessionsSchema.parse(sessions ?? [])) {
    const days = practised.get(s.profile_id) ?? new Set<string>();
    days.add(todayIn(HOUSEHOLD_TIME_ZONE, new Date(s.finished_at)));
    practised.set(s.profile_id, days);
  }
  const members = peopleSchema
    .parse(people ?? [])
    .toSorted((a, b) => Number(b.id === userId) - Number(a.id === userId));

  return (
    <section aria-label="Streaks" className="grid w-full grid-cols-2 gap-3">
      {members.map((m) => {
        const days = currentStreak(practised.get(m.id) ?? new Set(), today);
        return (
          <div key={m.id} className="rounded-lg border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {m.id === userId ? "You" : m.display_name}
            </p>
            <p className="text-3xl font-semibold tabular-nums">{days}</p>
            <p className="text-sm text-muted-foreground">day streak</p>
          </div>
        );
      })}
    </section>
  );
}
