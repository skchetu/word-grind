import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/week/dates";

const recapSchema = z.object({
  headline: z.string(),
  shared_patterns: z.array(z.string()),
  next_week_focus: z.array(z.string()),
  weeks: z.object({ starts_on: z.string() }),
});

// Claude's recap of the most recent week everyone tested on. Shows nothing
// until the first recap exists. RLS limits it to the household's weeks.
export async function LatestRecap() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("week_recaps")
    .select(
      "headline, shared_patterns, next_week_focus, weeks!inner(starts_on)",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return <RecapCard recap={recapSchema.parse(data)} />;
}

export function RecapCard({ recap }: { recap: z.infer<typeof recapSchema> }) {
  return (
    <section
      aria-labelledby="recap-heading"
      className="w-full rounded-lg border p-4"
    >
      <h2 id="recap-heading" className="mb-1 text-sm text-muted-foreground">
        Week of {formatDay(recap.weeks.starts_on, false)}
      </h2>
      <p className="mb-3 text-lg font-medium">{recap.headline}</p>
      <RecapList title="You both tripped on" items={recap.shared_patterns} />
      <RecapList title="Next week's focus" items={recap.next_week_focus} />
    </section>
  );
}

function RecapList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
