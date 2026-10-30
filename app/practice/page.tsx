import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { WeekPractice } from "./week-practice";

export const metadata: Metadata = { title: "Practice · Word Grind" };

export default function PracticePage() {
  return (
    <Page width="focus">
      <h1 className="text-3xl font-semibold tracking-tight">Practice</h1>
      <p className="text-sm text-muted-foreground">
        This week&apos;s words in random order. Practice isn&apos;t saved.
      </p>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <WeekPractice />
      </Suspense>
    </Page>
  );
}
