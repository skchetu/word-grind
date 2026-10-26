import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { WordDetail } from "./word-detail";

export const metadata: Metadata = { title: "Word · Word Grind" };

// One word's card and your answers for it: /words/rhythm.
export default function WordPage({ params }: PageProps<"/words/[word]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        {params.then(({ word }) => (
          <WordDetail text={decodeURIComponent(word)} />
        ))}
      </Suspense>
      <Button asChild variant="outline" className="self-center">
        <Link href="/words">All words</Link>
      </Button>
    </main>
  );
}
