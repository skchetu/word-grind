import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";

import { generateThisWeek } from "./actions";
import { GenerateWeekButton } from "./generate-week-button";

const weekSchema = z.object({
  theme: z.string(),
  week_words: z.array(
    z.object({
      position: z.int(),
      words: z.object({ text: z.string(), definition: z.string() }),
    }),
  ),
});

// This week's list for the household, or a button to make it. Reads the
// session, so it renders per request behind a Suspense boundary.
export async function ThisWeek() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weeks")
    .select("theme, week_words(position, words(text, definition))")
    .eq("starts_on", weekStart(todayIn(HOUSEHOLD_TIME_ZONE)))
    .maybeSingle();

  if (!data) {
    return (
      <form action={generateThisWeek}>
        <GenerateWeekButton />
      </form>
    );
  }

  const week = weekSchema.parse(data);
  const words = week.week_words.toSorted((a, b) => a.position - b.position);

  return (
    <section className="w-full text-left">
      <h2 className="text-sm font-medium text-muted-foreground">This week</h2>
      <p className="text-xl font-semibold">{week.theme}</p>
      <ol className="mt-3 divide-y rounded-lg border">
        {words.map(({ words: word }) => (
          <li key={word.text} className="px-4 py-3">
            <span className="font-medium">{word.text}</span>
            <span className="block text-sm text-muted-foreground">
              {word.definition}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
