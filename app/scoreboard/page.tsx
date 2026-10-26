import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { WeeklyScores } from "./weekly-scores";

export const metadata: Metadata = { title: "Scoreboard · Word Grind" };

export default function ScoreboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Scoreboard</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <WeeklyScores />
      </Suspense>
      <Button asChild variant="outline">
        <Link href="/">Home</Link>
      </Button>
    </main>
  );
}
