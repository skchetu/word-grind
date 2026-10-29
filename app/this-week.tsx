import { ChevronDown } from "lucide-react";
import { z } from "zod";

import { elevenLabsConfig } from "@/lib/speech/elevenlabs";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";

import { MakeThisWeek } from "./make-this-week";
import { RecordAudio } from "./record-audio-button";
import { ThemeNote } from "./theme-note";

const weekSchema = z.object({
  theme: z.string(),
  week_words: z.array(
    z.object({
      position: z.int(),
      words: z.object({
        text: z.string(),
        definition: z.string(),
        audio_path: z.string().nullable(),
      }),
    }),
  ),
});

const noteSchema = z.object({ theme_note: z.string().nullable() });

// This week's list for the household, or a note while it's being made. Reads the
// session, so it renders per request behind a Suspense boundary.
export async function ThisWeek() {
  const supabase = await createClient();
  const startsOn = weekStart(todayIn(HOUSEHOLD_TIME_ZONE));
  const [{ data, error }, { data: note }] = await Promise.all([
    supabase
      .from("weeks")
      .select(
        "theme, week_words(position, words(text, definition, audio_path))",
      )
      .eq("starts_on", startsOn)
      .maybeSingle(),
    // Asked for on its own, so the list still shows if the column isn't
    // there yet (a preview or deploy that runs before its migration).
    supabase
      .from("weeks")
      .select("theme_note")
      .eq("starts_on", startsOn)
      .maybeSingle(),
  ]);

  // A failed read isn't a missing list: making one would only fail to save.
  if (error) {
    console.error("Loading this week failed:", error.message);
    return (
      <p className="text-sm text-muted-foreground">
        This week&apos;s list couldn&apos;t be loaded. Try refreshing.
      </p>
    );
  }
  if (!data) return <MakeThisWeek />;

  const week = weekSchema.parse(data);
  const themeNote = noteSchema.safeParse(note).data?.theme_note ?? null;
  const words = week.week_words.toSorted((a, b) => a.position - b.position);
  const unrecorded = words.filter(({ words: w }) => !w.audio_path).length;

  return (
    <section className="w-full text-left">
      {/* Closed by default so the list doesn't push the rest of the page
          down; a native <details> opens with a tap, Enter or Space. */}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span>
            <h2 className="text-sm font-medium text-muted-foreground">
              This week · {words.length} words
            </h2>
            <span className="block text-xl font-semibold">
              {week.theme} {themeNote && <ThemeNote note={themeNote} />}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
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
      </details>
      {unrecorded > 0 && elevenLabsConfig() && (
        <RecordAudio count={unrecorded} />
      )}
    </section>
  );
}
