import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { LatestRecap } from "./latest-recap";
import { MissedWords } from "./missed-words";
import { ScoreboardColumns } from "./scoreboard-columns";
import { ScoreboardSkeleton } from "./scoreboard-skeleton";
import { Streaks } from "./streaks";
import { WeeklyScores } from "./weekly-scores";

export const metadata: Metadata = { title: "Scoreboard · Word Grind" };

export default function ScoreboardPage() {
  return (
    <Page width="wide">
      <h1 className="text-3xl font-semibold tracking-tight">Scoreboard</h1>
      {/* One boundary for every box, so they all appear together. */}
      <Suspense fallback={<ScoreboardSkeleton />}>
        <ScoreboardColumns
          left={
            <>
              <LatestRecap />
              {/* Boxed like the cards beside it, so the chart doesn't float
                  loose next to them. */}
              <section
                aria-label="Weekly scores"
                className="flex w-full flex-col gap-6 rounded-lg border p-4"
              >
                <WeeklyScores />
              </section>
            </>
          }
          right={
            <>
              <Streaks />
              <MissedWords />
            </>
          }
        />
      </Suspense>
    </Page>
  );
}
