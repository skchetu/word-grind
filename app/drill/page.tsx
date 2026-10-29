import type { Metadata } from "next";
import { Suspense } from "react";

import { Page } from "@/components/page";

import { WeekDrill } from "./week-drill";

export const metadata: Metadata = { title: "Drill · Word Grind" };

export default function DrillPage() {
  return (
    <Page width="focus">
      <h1 className="text-3xl font-semibold tracking-tight">Daily drill</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <WeekDrill />
      </Suspense>
    </Page>
  );
}
