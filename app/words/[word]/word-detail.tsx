import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { attemptHistory } from "@/lib/library/history";
import { createClient } from "@/lib/supabase/server";
import { formatDay, HOUSEHOLD_TIME_ZONE } from "@/lib/week/dates";

const wordSchema = z.object({
  id: z.string(),
  text: z.string(),
  part_of_speech: z.string(),
  ipa: z.string(),
  definition: z.string(),
  origin: z.string(),
  mnemonic: z.string(),
  word_sentences: z.array(z.object({ id: z.string(), sentence: z.string() })),
});
const attemptsSchema = z.array(
  z
    .object({
      typed: z.string(),
      correct: z.boolean(),
      created_at: z.string(),
      sessions: z.object({ kind: z.enum(["drill", "test"]) }),
    })
    .transform((a) => ({
      typed: a.typed,
      correct: a.correct,
      createdAt: a.created_at,
      kind: a.sessions.kind,
    })),
);

// A word's definition, example sentences and origin, then every answer
// you've given for it.
export async function WordDetail({ text }: { text: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  // `text` is case-insensitive (citext), so /words/Rhythm finds "rhythm".
  const { data } = await supabase
    .from("words")
    .select(
      "id, text, part_of_speech, ipa, definition, origin, mnemonic, word_sentences(id, sentence)",
    )
    .eq("text", text)
    .maybeSingle();
  if (!data) notFound();
  const word = wordSchema.parse(data);

  const { data: attempts } = await supabase
    .from("attempts")
    .select("typed, correct, created_at, sessions!inner(kind, profile_id)")
    .eq("word_id", word.id)
    .eq("sessions.profile_id", userId);
  const history = attemptHistory(
    attemptsSchema.parse(attempts ?? []),
    HOUSEHOLD_TIME_ZONE,
  );

  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{word.text}</h1>
        <p className="text-muted-foreground">
          {word.ipa} · {word.part_of_speech}
        </p>
      </header>
      <p>{word.definition}</p>
      {word.word_sentences.length > 0 && (
        <section>
          <h2 className="mb-2 font-medium">Examples</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {word.word_sentences.map((s) => (
              <li key={s.id}>{s.sentence}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="text-sm">
        <h2 className="mb-1 text-base font-medium">Origin</h2>
        <p>{word.origin}</p>
        <h2 className="mt-4 mb-1 text-base font-medium">Memory trick</h2>
        <p>{word.mnemonic}</p>
      </section>
      <section>
        <h2 className="mb-2 font-medium">Your answers</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t answered this word yet.
          </p>
        ) : (
          <ol className="divide-y rounded-lg border text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between gap-3 px-4 py-2">
                <span className={h.correct ? "" : "text-destructive"}>
                  {h.correct ? "✓" : "✗"} {h.typed || "(blank)"}
                </span>
                <span className="text-muted-foreground">
                  {h.kind === "test" ? "Test, " : ""}
                  {formatDay(h.day, false)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
