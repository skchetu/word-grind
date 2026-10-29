import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { LatestRecap } from "./latest-recap";
import { MissedWords } from "./missed-words";
import { Streaks } from "./streaks";
import { WeeklyScores } from "./weekly-scores";

export const metadata: Metadata = { title: "Scoreboard · Word Grind" };

export default function ScoreboardPage() {
  return (
    <Page width="focus">
      <h1 className="text-3xl font-semibold tracking-tight">Scoreboard</h1>
      <Suspense>
        <LatestRecap />
      </Suspense>
      <Suspense>
        <Streaks />
      </Suspense>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <WeeklyScores />
      </Suspense>
      <Suspense>
        <MissedWords />
      </Suspense>
    </Page>
  );
}
