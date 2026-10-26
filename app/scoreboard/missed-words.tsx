import { redirect } from "next/navigation";
import { z } from "zod";

import { mostMissed } from "@/lib/scoreboard/missed";
import { addDays } from "@/lib/srs/schedule";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn } from "@/lib/week/dates";

const DAYS = 30;

const peopleSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);
const missesSchema = z.array(
  z
    .object({
      sessions: z.object({ profile_id: z.string() }),
      words: z.object({ text: z.string() }),
    })
    .transform((m) => ({
      profileId: m.sessions.profile_id,
      word: m.words.text,
    })),
);

// Each person's three most-missed words over the last month, you first.
export async function MissedWords() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  // RLS limits both reads to the household. Only wrong answers are fetched,
  // and only recent ones, so the list reflects what's hard right now.
  const since = addDays(todayIn(HOUSEHOLD_TIME_ZONE), -DAYS);
  const [{ data: people }, { data: misses }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("attempts")
      .select("sessions!inner(profile_id), words!inner(text)")
      .eq("correct", false)
      .gte("created_at", since),
  ]);

  const missed = mostMissed(missesSchema.parse(misses ?? []));
  const members = peopleSchema
    .parse(people ?? [])
    .toSorted((a, b) => Number(b.id === userId) - Number(a.id === userId));

  return (
    <section aria-labelledby="missed-heading" className="w-full">
      <h2 id="missed-heading" className="mb-3 font-medium">
        Most-missed words
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          last {DAYS} days
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {members.map((m) => {
          const words = missed.get(m.id) ?? [];
          return (
            <div key={m.id} className="rounded-lg border p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                {m.id === userId ? "You" : m.display_name}
              </p>
              {words.length === 0 ? (
                <p className="text-sm text-muted-foreground">No misses yet</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {words.map((w) => (
                    <li key={w.word} className="flex justify-between gap-2">
                      <span className="truncate">{w.word}</span>
                      <span className="text-muted-foreground tabular-nums">
                        ×{w.misses}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
