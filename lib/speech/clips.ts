import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { AUDIO_BUCKET } from "./audio-url";
import { synthesize, type ElevenLabsConfig } from "./elevenlabs";

// One recording to make: the text to read, where to store it, and the row
// whose audio_path points at it.
export type ClipJob = {
  table: "words" | "word_sentences";
  id: string;
  text: string;
  path: string;
};

const weekRowsSchema = z.array(
  z.object({
    word: z.object({
      id: z.string(),
      text: z.string(),
      audio_path: z.string().nullable(),
      word_sentences: z.array(
        z.object({
          id: z.string(),
          sentence: z.string(),
          audio_path: z.string().nullable(),
        }),
      ),
    }),
  }),
);

// The clips a week still needs. Words carried over from earlier weeks may
// already have theirs.
export function clipJobs(rows: unknown): ClipJob[] {
  return weekRowsSchema.parse(rows).flatMap(({ word }) => [
    ...(word.audio_path
      ? []
      : [
          {
            table: "words" as const,
            id: word.id,
            text: word.text,
            path: `words/${word.id}.mp3`,
          },
        ]),
    ...word.word_sentences
      .filter((s) => !s.audio_path)
      .map((s) => ({
        table: "word_sentences" as const,
        id: s.id,
        text: s.sentence,
        path: `sentences/${s.id}.mp3`,
      })),
  ]);
}

export type ClipSteps = {
  record: (text: string) => Promise<ArrayBuffer>;
  store: (path: string, mp3: ArrayBuffer) => Promise<void>;
  link: (job: ClipJob) => Promise<void>;
};

// Makes each clip, a few at a time. A clip that fails is skipped, and that
// word or sentence keeps using the browser voice. Returns how many were made.
export async function makeClips(
  jobs: ClipJob[],
  steps: ClipSteps,
  concurrency = 2,
): Promise<number> {
  const queue = [...jobs];
  let made = 0;
  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        await steps.store(job.path, await steps.record(job.text));
        await steps.link(job);
        made++;
      } catch (error) {
        console.error(`Clip for ${job.path} failed:`, error);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return made;
}

// Records every missing clip for a week with ElevenLabs and saves it to
// Supabase Storage. Runs on the server after the week is saved.
export async function recordWeekAudio(
  supabase: SupabaseClient,
  weekId: string,
  config: ElevenLabsConfig,
) {
  const { data, error } = await supabase
    .from("week_words")
    .select(
      "word:words(id, text, audio_path, word_sentences(id, sentence, audio_path))",
    )
    .eq("week_id", weekId);
  if (error)
    throw new Error(`Loading the week's words failed: ${error.message}`);

  return makeClips(clipJobs(data), {
    record: (text) => synthesize(text, config),
    async store(path, mp3) {
      const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, mp3, { contentType: "audio/mpeg" });
      // A clip uploaded by an earlier, interrupted run only needs linking.
      if (error && !("statusCode" in error && error.statusCode === "409")) {
        throw error;
      }
    },
    async link({ table, id, path }) {
      const { error } = await supabase
        .from(table)
        .update({ audio_path: path })
        .eq("id", id);
      if (error) throw error;
    },
  });
}
