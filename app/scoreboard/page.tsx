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
    <Page width="wide">
      <h1 className="text-3xl font-semibold tracking-tight">Scoreboard</h1>
      {/* One column on phones and tablets. From lg, the recap and weekly
          scores take the wider left column, streaks and most-missed words
          the right. */}
      <div className="grid w-full max-w-md gap-6 lg:max-w-none lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Suspense>
            <LatestRecap />
          </Suspense>
          {/* Boxed like the cards beside it, so the chart doesn't float
              loose next to them. */}
          <section
            aria-label="Weekly scores"
            className="flex w-full flex-col gap-6 rounded-lg border p-4"
          >
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading…</p>
              }
            >
              <WeeklyScores />
            </Suspense>
          </section>
        </div>
        <div className="flex flex-col gap-6">
          <Suspense>
            <Streaks />
          </Suspense>
          <Suspense>
            <MissedWords />
          </Suspense>
        </div>
      </div>
    </Page>
  );
}
