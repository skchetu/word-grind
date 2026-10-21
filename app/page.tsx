import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { SignedInAs } from "./signed-in-as";
import { ThisWeek } from "./this-week";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Word Grind</h1>
      <p className="text-muted-foreground">
        A weekly word list, a five-minute daily drill and a Sunday test.
      </p>
      <Button asChild size="lg">
        <Link href="/drill">Start a drill</Link>
      </Button>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <ThisWeek />
      </Suspense>
      <Suspense>
        <SignedInAs />
      </Suspense>
    </main>
  );
}
