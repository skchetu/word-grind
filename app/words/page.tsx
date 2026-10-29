import type { Metadata } from "next";
import { Suspense } from "react";

import { WordLibrary } from "./word-library";

export const metadata: Metadata = { title: "Words · Word Grind" };

export default function WordsPage({ searchParams }: PageProps<"/words">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 pt-6 pb-8 md:pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Words</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        {searchParams.then(({ q }) => (
          <WordLibrary search={typeof q === "string" ? q : ""} />
        ))}
      </Suspense>
    </main>
  );
}
