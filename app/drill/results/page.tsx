import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { TodaysResults } from "./todays-results";

export const metadata: Metadata = { title: "Today's results · Word Grind" };

export default function DrillResultsPage() {
  return (
    <Page width="focus">
      <h1 className="text-3xl font-semibold tracking-tight">
        Today&apos;s results
      </h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <TodaysResults />
      </Suspense>
    </Page>
  );
}
