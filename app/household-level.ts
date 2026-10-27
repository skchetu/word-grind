import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { adaptDifficulty } from "@/lib/difficulty/adapt";
import { addDays } from "@/lib/srs/schedule";

const householdSchema = z.object({ id: z.uuid(), difficulty: z.int() });
const answersSchema = z.array(z.object({ correct: z.boolean() }));

export type HouseholdLevel = {
  householdId: string;
  previous: number;
  level: number;
};

// The level for the week starting on startsOn: last week's level, nudged by
// how the whole household did on last week's Sunday test. Tests made up
// after this runs don't count, and no test at all leaves the level alone.
// RLS limits every read to the caller's household.
export async function nextHouseholdLevel(
  supabase: SupabaseClient,
  startsOn: string,
): Promise<HouseholdLevel> {
  const [{ data: household }, { data: answers }] = await Promise.all([
    supabase.from("households").select("id, difficulty").single(),
    supabase
      .from("attempts")
      .select("correct, sessions!inner(kind, weeks!inner(starts_on))")
      .eq("sessions.kind", "test")
      .eq("sessions.weeks.starts_on", addDays(startsOn, -7)),
  ]);

  const { id, difficulty } = householdSchema.parse(household);
  const tests = answersSchema.parse(answers ?? []);
  const level = adaptDifficulty(difficulty, {
    correct: tests.filter((a) => a.correct).length,
    total: tests.length,
  });
  return { householdId: id, previous: difficulty, level };
}

// Saves the new level once the week's list is saved, so a failed save
// can't nudge the level twice. The week keeps the level it was written for,
// which the recap uses to show how the level moved.
export async function saveHouseholdLevel(
  supabase: SupabaseClient,
  weekId: string,
  { householdId, previous, level }: HouseholdLevel,
) {
  const [week, household] = await Promise.all([
    supabase.from("weeks").update({ difficulty: level }).eq("id", weekId),
    level === previous
      ? { error: null }
      : supabase
          .from("households")
          .update({ difficulty: level })
          .eq("id", householdId),
  ]);
  for (const { error } of [week, household]) {
    if (error) console.error("Saving the difficulty failed:", error.message);
  }
}
