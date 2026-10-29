import { z } from "zod";

import { masteredCounts } from "@/lib/srs/mastered";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";

import { loadStreaks } from "./scoreboard/load-streaks";

const peopleSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);
const weekSchema = z.object({
  week_words: z.array(z.object({ word_id: z.string() })),
});
const boxesSchema = z.array(
  z
    .object({ profile_id: z.string(), word_id: z.string(), box: z.int() })
    .transform((r) => ({
      profileId: r.profile_id,
      wordId: r.word_id,
      box: r.box,
    })),
);

// This week's words mastered and the daily streak for everyone in the
// household, you first. Renders nothing until there's a list this week.
export async function WeekProgress() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  // RLS limits every read to the household.
  const [{ data: week }, { data: people }, { data: boxes }, streaks] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("week_words(word_id)")
        .eq("starts_on", weekStart(todayIn(HOUSEHOLD_TIME_ZONE)))
        .maybeSingle(),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("review_state").select("profile_id, word_id, box"),
      loadStreaks(supabase),
    ]);
  if (!week) return null;

  const wordIds = new Set(
    weekSchema.parse(week).week_words.map((w) => w.word_id),
  );
  const mastered = masteredCounts(boxesSchema.parse(boxes ?? []), wordIds);
  const members = peopleSchema
    .parse(people ?? [])
    .toSorted((a, b) => Number(b.id === userId) - Number(a.id === userId));

  return (
    <div className="w-full rounded-lg border px-4 py-1">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 font-medium">This week</th>
            {members.map((m) => (
              <th key={m.id} className="py-2 pl-4 text-right font-medium">
                {m.id === userId ? "You" : m.display_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr className="border-b">
            <th className="py-3 font-normal">Words mastered</th>
            {members.map((m) => (
              <td key={m.id} className="py-3 pl-4 text-right">
                {mastered.get(m.id) ?? 0} / {wordIds.size}
              </td>
            ))}
          </tr>
          <tr>
            <th className="py-3 font-normal">Streak</th>
            {members.map((m) => {
              const days = streaks.get(m.id) ?? 0;
              return (
                <td key={m.id} className="py-3 pl-4 text-right">
                  {days === 1 ? "1 day" : `${days} days`}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
