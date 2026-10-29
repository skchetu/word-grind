import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { WeekTest } from "./week-test";

export const metadata: Metadata = { title: "Sunday test · Word Grind" };

export default function TestPage() {
  return (
    <Page width="focus">
      <h1 className="text-3xl font-semibold tracking-tight">Sunday test</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <WeekTest />
      </Suspense>
    </Page>
  );
}
