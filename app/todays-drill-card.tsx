import Link from "next/link";

import { CopyResult } from "@/components/session/copy-result";
import { Button } from "@/components/ui/button";
import { drillMinutes } from "@/lib/srs/pick";

import { todaysDrill } from "./drill/todays-drill";

// How many words today's drill holds and roughly how long it takes, with
// the button to start it. Once it's done, a button to copy today's result.
export async function TodaysDrillCard() {
  const drill = await todaysDrill();
  const count = drill?.words.length;

  return (
    <section
      aria-labelledby="drill-heading"
      className="w-full rounded-lg border p-4 text-left"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="drill-heading" className="font-semibold">
          Today&apos;s drill
        </h2>
        {count !== undefined && (
          <p className="text-sm text-muted-foreground">
            {count === 1 ? "1 word due" : `${count} words due`}
          </p>
        )}
      </div>
      {count === 0 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            All caught up. Come back tomorrow.
          </p>
          {drill?.todaysMarks && (
            <CopyResult mode="drill" results={drill.todaysMarks} size="sm" />
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {count === undefined
              ? "Practise with the starter words"
              : `About ${drillMinutes(count)} min`}
          </p>
          <Button asChild>
            <Link href="/drill">Start</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
