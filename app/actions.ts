"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { generateWeek } from "@/lib/ai/generate-week";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import { toSavePayload } from "@/lib/week/save";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const profileSchema = z.object({
  difficulty: z.int(),
  topics: z.array(z.string()),
});
const recentWordsSchema = z.array(z.object({ text: z.string() }));

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Makes this week's list for the household, unless it already has one.
export async function generateThisWeek() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const startsOn = weekStart(todayIn(HOUSEHOLD_TIME_ZONE));

  // Row-level security limits this to the caller's household.
  const { data: existing } = await supabase
    .from("weeks")
    .select("id")
    .eq("starts_on", startsOn)
    .maybeSingle();
  if (existing) return;

  const [{ data: profile }, { data: recent }] = await Promise.all([
    supabase
      .from("profiles")
      .select("difficulty, topics")
      .eq("id", userId)
      .single(),
    supabase
      .from("words")
      .select("text")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const { difficulty, topics } = profileSchema.parse(profile);
  const avoid = recentWordsSchema.parse(recent ?? []).map((row) => row.text);

  const { week } = await generateWeek(
    { difficulty, topics, avoid },
    { weekNumber: Math.floor(Date.parse(startsOn) / WEEK_MS) },
  );

  const { error } = await supabase.rpc("save_week", {
    p_starts_on: startsOn,
    p_week: toSavePayload(week),
  });
  if (error) throw new Error(`Saving the week failed: ${error.message}`);

  revalidatePath("/");
}
