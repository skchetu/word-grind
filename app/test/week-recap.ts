import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { canCallClaude, logClaudeCall } from "@/lib/ai/calls";
import { generateRecap, RECAP_MODEL } from "@/lib/ai/generate-recap";
import { recapPlayers } from "@/lib/recap/recap";

const membersSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);
const answersSchema = z.array(
  z.object({
    typed: z.string(),
    correct: z.boolean(),
    words: z.object({ text: z.string() }),
    sessions: z.object({ profile_id: z.string() }),
  }),
);

// Writes the week's recap once every member has taken its test. Runs after
// each test is saved; whichever test finishes last triggers it. Does nothing
// if the recap already exists, someone hasn't taken the test yet, or the
// daily limit is reached. RLS limits every read to the caller's household.
export async function createWeekRecap(
  supabase: SupabaseClient,
  userId: string,
  weekId: string,
) {
  const { data: existing } = await supabase
    .from("week_recaps")
    .select("week_id")
    .eq("week_id", weekId)
    .maybeSingle();
  if (existing) return;

  const [{ data: members }, { data: answers }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("attempts")
      .select("typed, correct, words!inner(text), sessions!inner(profile_id)")
      .eq("sessions.week_id", weekId)
      .eq("sessions.kind", "test"),
  ]);
  const players = recapPlayers(
    membersSchema.parse(members ?? []).map((m) => ({
      id: m.id,
      name: m.display_name,
    })),
    answersSchema.parse(answers ?? []).map((a) => ({
      profileId: a.sessions.profile_id,
      word: a.words.text,
      typed: a.typed,
      correct: a.correct,
    })),
  );
  if (!players) return;
  if (!(await canCallClaude(supabase, userId, "recap"))) return;

  const { recap, usage } = await generateRecap(players);
  await logClaudeCall(supabase, {
    userId,
    feature: "recap",
    model: RECAP_MODEL,
    usage,
  });
  if (!recap) return;

  // The week_id primary key refuses a second recap, such as when both
  // tests finish at the same moment; that duplicate is ignored.
  const { error } = await supabase.from("week_recaps").insert({
    week_id: weekId,
    headline: recap.headline,
    shared_patterns: recap.sharedPatterns,
    next_week_focus: recap.nextWeekFocus,
  });
  if (error && error.code !== "23505") {
    console.error("Saving the recap failed:", error.message);
  }
}
