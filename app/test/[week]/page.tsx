import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { Page } from "@/components/page";

import { WeekTest } from "../week-test";

export const metadata: Metadata = { title: "Sunday test · Word Grind" };

// A past week's test, addressed by its Monday: /test/2026-10-19.
export default function WeekTestPage({ params }: PageProps<"/test/[week]">) {
  return (
    <Page width="focus">
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
    </Page>
  );
}
