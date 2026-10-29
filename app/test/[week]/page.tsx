import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { WeekTest } from "../week-test";

export const metadata: Metadata = { title: "Sunday test · Word Grind" };

// A past week's test, addressed by its Monday: /test/2026-10-19.
export default function WeekTestPage({ params }: PageProps<"/test/[week]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 pt-6 pb-8 md:pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sunday test</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        {params.then(({ week }) => {
          const startsOn = z.iso.date().safeParse(week);
          if (!startsOn.success) notFound();
          return <WeekTest startsOn={startsOn.data} />;
        })}
      </Suspense>
    </main>
  );
}
