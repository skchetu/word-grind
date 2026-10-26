import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { loadStreaks } from "./load-streaks";

const peopleSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);

// Each person's daily practice streak, you first.
export async function Streaks() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const [{ data: people }, streaks] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    loadStreaks(supabase),
  ]);
  const members = peopleSchema
    .parse(people ?? [])
    .toSorted((a, b) => Number(b.id === userId) - Number(a.id === userId));

  return (
    <section aria-label="Streaks" className="grid w-full grid-cols-2 gap-3">
      {members.map((m) => (
        <div key={m.id} className="rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {m.id === userId ? "You" : m.display_name}
          </p>
          <p className="text-3xl font-semibold tabular-nums">
            {streaks.get(m.id) ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">day streak</p>
        </div>
      ))}
    </section>
  );
}
