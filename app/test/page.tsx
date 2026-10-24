import type { Metadata } from "next";
import { Suspense } from "react";

import { WeekTest } from "./week-test";

export const metadata: Metadata = { title: "Sunday test · Word Grind" };

export default function TestPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Sunday test</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <WeekTest />
      </Suspense>
    </main>
  );
}
