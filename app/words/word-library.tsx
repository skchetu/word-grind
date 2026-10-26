import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { libraryRows } from "@/lib/library/rows";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/week/dates";

const reviewsSchema = z.array(
  z
    .object({
      word_id: z.string(),
      box: z.int(),
      due_on: z.string(),
      words: z.object({ text: z.string() }),
    })
    .transform((r) => ({
      wordId: r.word_id,
      text: r.words.text,
      box: r.box,
      dueOn: r.due_on,
    })),
);
const missesSchema = z.array(z.object({ word_id: z.string() }));

// Every word you've reviewed: how far along it is (Leitner box 1 to 5), how
// often you've missed it and when it's next due. The search lives in the
// URL (?q=), so it survives a refresh and works without JavaScript.
export async function WordLibrary({ search }: { search: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const [{ data: reviews }, { data: misses }] = await Promise.all([
    supabase
      .from("review_state")
      .select("word_id, box, due_on, words!inner(text)")
      .eq("profile_id", userId),
    supabase
      .from("attempts")
      .select("word_id, sessions!inner(profile_id)")
      .eq("sessions.profile_id", userId)
      .eq("correct", false),
  ]);
  const rows = libraryRows(
    reviewsSchema.parse(reviews ?? []),
    missesSchema.parse(misses ?? []).map((m) => m.word_id),
    search,
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <form role="search" className="flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search your words"
          aria-label="Search your words"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {search
            ? `No words match “${search}”.`
            : "Words show up here after your first drill."}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 font-medium">Word</th>
              <th className="py-2 pl-3 text-right font-medium">Box</th>
              <th className="py-2 pl-3 text-right font-medium">Missed</th>
              <th className="py-2 pl-3 text-right font-medium">Next</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => (
              <tr key={row.wordId} className="border-b last:border-0">
                <td className="py-3 font-medium">
                  <Link
                    href={`/words/${encodeURIComponent(row.text)}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.text}
                  </Link>
                </td>
                <td className="py-3 pl-3 text-right">{row.box} / 5</td>
                <td className="py-3 pl-3 text-right">{row.misses}</td>
                <td className="py-3 pl-3 text-right whitespace-nowrap">
                  {formatDay(row.dueOn, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
