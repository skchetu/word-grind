import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { WordLibrary } from "./word-library";

export const metadata: Metadata = { title: "Words · Word Grind" };

export default function WordsPage({ searchParams }: PageProps<"/words">) {
  return (
    <Page width="reading">
      <h1 className="text-3xl font-semibold tracking-tight">Words</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        {searchParams.then(({ q }) => (
          <WordLibrary search={typeof q === "string" ? q : ""} />
        ))}
      </Suspense>
    </Page>
  );
}
