"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { topUpWeekSentences } from "@/app/drill/fresh-sentences";
import { nextHouseholdLevel, saveHouseholdLevel } from "@/app/household-level";
import { createWeekRecap } from "@/app/test/week-recap";
import { canCallClaude, logClaudeCall } from "@/lib/ai/calls";
import { generateTip, plainTip, TIP_MODEL } from "@/lib/ai/generate-tip";
import { generateWeek, WEEK_MODEL } from "@/lib/ai/generate-week";
import { normalize } from "@/lib/grading/normalize";
import type { Mode } from "@/lib/session/machine";
import {
  answerSchema,
  drillRecords,
  testAnswers,
  type Answer,
} from "@/lib/session/records";
import { recordWeekAudio } from "@/lib/speech/clips";
import { elevenLabsConfig } from "@/lib/speech/elevenlabs";
import { DRILL_CAP } from "@/lib/srs/pick";
import { reviewStateSchema } from "@/lib/srs/schedule";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_TIME_ZONE, todayIn, weekStart } from "@/lib/week/dates";
import { toSavePayload } from "@/lib/week/save";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const topicsSchema = z.array(z.object({ topics: z.array(z.string()) }));
const recentWordsSchema = z.array(z.object({ text: z.string() }));
const focusSchema = z
  .object({ next_week_focus: z.array(z.string()) })
  .nullable();
const tipInputSchema = z.object({
  wordId: z.uuid(),
  answer: z.string().max(60),
});
const wordSchema = z.object({ text: z.string(), mnemonic: z.string() });

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

  // Each failed save would otherwise cost another Claude call per click.
  if (!(await canCallClaude(supabase, userId, "week"))) {
    throw new Error("Daily limit for new lists reached. Try again tomorrow.");
  }

  // The household shares one list, so it uses the household's level (nudged
  // by last week's test) and everyone's topics. RLS limits both reads to the caller's household.
  const [
    householdLevel,
    { data: members },
    { data: recent },
    { data: lastRecap },
  ] = await Promise.all([
    nextHouseholdLevel(supabase, startsOn),
    supabase.from("profiles").select("topics"),
    supabase
      .from("words")
      .select("text")
      .order("created_at", { ascending: false })
      .limit(100),
    // Last week's recap, so the new list practises what we both missed.
    supabase
      .from("week_recaps")
      .select("next_week_focus")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const difficulty = householdLevel.level;
  const topics = [
    ...new Set(topicsSchema.parse(members ?? []).flatMap((m) => m.topics)),
  ];
  const avoid = recentWordsSchema.parse(recent ?? []).map((row) => row.text);
  const focus = focusSchema.parse(lastRecap)?.next_week_focus ?? [];

  const { week, usage } = await generateWeek(
    { difficulty, topics, avoid, focus },
    { weekNumber: Math.floor(Date.parse(startsOn) / WEEK_MS) },
  );

  // Logged even for a fallback week: rejected attempts are still billed.
  await logClaudeCall(supabase, {
    userId,
    feature: "week",
    model: WEEK_MODEL,
    usage,
  });

  const { data: weekId, error } = await supabase.rpc("save_week", {
    p_starts_on: startsOn,
    p_week: toSavePayload(week),
  });
  if (error) throw new Error(`Saving the week failed: ${error.message}`);
  const savedWeekId = z.uuid().parse(weekId);
  await saveHouseholdLevel(supabase, savedWeekId, householdLevel);
  if (week.themeNote) {
    const { error: noteError } = await supabase
      .from("weeks")
      .update({ theme_note: week.themeNote })
      .eq("id", savedWeekId);
    if (noteError) console.error("Saving the theme note failed:", noteError);
  }

  // After the response, so the new list shows up straight away: words with
  // fewer than three sentences (backup-list words, and words saved before
  // lists had three) get topped up, then every missing clip is recorded.
  // Until a clip exists, the drill uses the browser voice.
  const voice = elevenLabsConfig();
  after(async () => {
    try {
      await topUpWeekSentences(supabase, userId, savedWeekId);
      if (voice) await recordWeekAudio(supabase, savedWeekId, voice);
    } catch (failure) {
      console.error(
        "Preparing the week's sentences and audio failed:",
        failure,
      );
    }
  });

  revalidatePath("/");
}

// Records any missing clips for this week's words, such as words saved
// before recording existed or clips that failed the first time. Returns an
// error message when any clip failed; the details are in the server logs.
export async function recordThisWeekAudio(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) redirect("/login");

  const voice = elevenLabsConfig();
  if (!voice) return null;

  const { data: week } = await supabase
    .from("weeks")
    .select("id")
    .eq("starts_on", weekStart(todayIn(HOUSEHOLD_TIME_ZONE)))
    .maybeSingle();
  if (!week) return null;

  const { failed } = await recordWeekAudio(
    supabase,
    z.object({ id: z.uuid() }).parse(week).id,
    voice,
  );
  revalidatePath("/");
  return failed > 0 ? "Error: Please see logs for further details." : null;
}

// A tip for one misspelling: from the cache when this exact mistake has
// been seen before, otherwise from Claude (then cached). Falls back to the
// word's mnemonic whenever Claude can't or shouldn't be called.
export async function getMistakeTip(wordId: string, answer: string) {
  const input = tipInputSchema.parse({ wordId, answer });
  const wrong = normalize(input.answer);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const [{ data: cached }, { data: wordRow }] = await Promise.all([
    supabase
      .from("tip_cache")
      .select("tip")
      .eq("word_id", input.wordId)
      .eq("wrong", wrong)
      .maybeSingle(),
    supabase
      .from("words")
      .select("text, mnemonic")
      .eq("id", input.wordId)
      .single(),
  ]);
  if (cached) return z.object({ tip: z.string() }).parse(cached).tip;

  const word = wordSchema.parse(wordRow);
  if (wrong === "" || wrong === word.text.toLowerCase()) return word.mnemonic;
  if (!(await canCallClaude(supabase, userId, "tip"))) {
    return plainTip(word.text, wrong, word.mnemonic);
  }

  const { tip, source, usage } = await generateTip({
    word: word.text,
    wrong,
    mnemonic: word.mnemonic,
  });
  await logClaudeCall(supabase, {
    userId,
    feature: "tip",
    model: TIP_MODEL,
    usage,
  });

  // Only Claude's tips are cached; a fallback should get another try later.
  if (source === "claude") {
    await supabase
      .from("tip_cache")
      .upsert(
        { word_id: input.wordId, wrong, tip },
        { onConflict: "word_id,wrong", ignoreDuplicates: true },
      );
  }
  return tip;
}

const sessionInputSchema = z.object({
  weekId: z.uuid(),
  kind: z.enum(["drill", "test"]),
  answers: z.array(answerSchema).min(1).max(DRILL_CAP),
});
const textRowsSchema = z.array(z.object({ id: z.string(), text: z.string() }));
// A review_state row as [word id, ReviewState], ready for a Map.
const stateRowsSchema = z.array(
  z
    .object({
      word_id: z.string(),
      box: z.int(),
      due_on: z.string(),
      correct_streak: z.int(),
      lapses: z.int(),
    })
    .transform(
      (s) =>
        [
          s.word_id,
          reviewStateSchema.parse({
            box: s.box,
            dueOn: s.due_on,
            correctStreak: s.correct_streak,
            lapses: s.lapses,
          }),
        ] as const,
    ),
);

// Saves a finished drill or test: the session with its score, every
// attempt, and each word's new Leitner box. Answers are graded again here
// against the stored words, and a test is scored against its week's whole
// list. Returns false when anything failed to save.
export async function saveSession(input: {
  weekId: string;
  kind: Mode;
  answers: Answer[];
}): Promise<boolean> {
  const { weekId, kind, ...parsed } = sessionInputSchema.parse(input);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  let answers = parsed.answers;
  if (kind === "test") {
    // RLS limits this to the caller's household's weeks.
    const { data: listed } = await supabase
      .from("week_words")
      .select("word_id")
      .eq("week_id", weekId)
      .order("position");
    const ids = z.array(z.object({ word_id: z.string() })).parse(listed ?? []);
    answers = testAnswers(
      answers,
      ids.map((row) => row.word_id),
    );
  }

  const wordIds = answers.map((a) => a.wordId);
  const [{ data: words }, { data: states }] = await Promise.all([
    supabase.from("words").select("id, text").in("id", wordIds),
    supabase
      .from("review_state")
      .select("word_id, box, due_on, correct_streak, lapses")
      .eq("profile_id", userId)
      .in("word_id", wordIds),
  ]);
  const today = todayIn(HOUSEHOLD_TIME_ZONE);
  const { score, total, attempts, reviews } = drillRecords(
    answers,
    new Map(textRowsSchema.parse(words ?? []).map((w) => [w.id, w.text])),
    new Map(stateRowsSchema.parse(states ?? [])),
    today,
  );
  if (total === 0) return false;

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      profile_id: userId,
      week_id: weekId,
      kind,
      finished_at: new Date().toISOString(),
      score,
      total,
    })
    .select("id")
    .single();
  if (error) {
    console.error(`Saving the ${kind} session failed:`, error);
    return false;
  }
  const sessionId = z.object({ id: z.uuid() }).parse(session).id;

  const [saved, moved] = await Promise.all([
    supabase
      .from("attempts")
      .insert(attempts.map((a) => ({ ...a, session_id: sessionId }))),
    supabase
      .from("review_state")
      .upsert(reviews.map((r) => ({ ...r, profile_id: userId }))),
  ]);
  for (const { error } of [saved, moved]) {
    if (error) console.error(`Saving the ${kind} answers failed:`, error);
  }

  // The recap is written after the response, so the results show at once.
  if (kind === "test" && !saved.error) {
    after(() =>
      createWeekRecap(supabase, userId, weekId).catch((failure: unknown) =>
        console.error("Writing the recap failed:", failure),
      ),
    );
  }
  return !saved.error && !moved.error;
}
