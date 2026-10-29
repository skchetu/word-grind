import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";

import { WordDetail } from "./word-detail";

export const metadata: Metadata = { title: "Word · Word Grind" };

// One word's card and your answers for it: /words/rhythm.
export default function WordPage({ params }: PageProps<"/words/[word]">) {
  return (
    <Page width="reading" className="items-stretch">
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
    </Page>
  );
}
