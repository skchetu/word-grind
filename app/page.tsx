import { Suspense } from "react";

import { Page } from "@/components/page";

import {
  DrillCardSkeleton,
  LineSkeleton,
  ThisWeekSkeleton,
  WeekProgressSkeleton,
} from "./home-skeletons";
import { PendingTestsBanner } from "./pending-tests-banner";
import { SignedInAs } from "./signed-in-as";
import { TestCountdown } from "./test-countdown";
import { ThisWeek } from "./this-week";
import { TodaysDrillCard } from "./todays-drill-card";
import { WeekProgress } from "./week-progress";

export default function Home() {
  return (
    <Page width="wide" className="text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="text-muted-foreground">
          A weekly word list, a five-minute daily drill and a Sunday test.
        </p>
      </div>
      {/* One column on phones and tablets, in the same order as before. From
          lg, today's tasks sit on the left and the week's progress on the
          right. */}
      <div className="grid w-full max-w-md gap-6 lg:max-w-none lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <Suspense>
            <PendingTestsBanner />
          </Suspense>
          <Suspense fallback={<DrillCardSkeleton />}>
            <TodaysDrillCard />
          </Suspense>
          <Suspense fallback={<LineSkeleton />}>
            <TestCountdown />
          </Suspense>
        </div>
        <div className="flex flex-col gap-6">
          <Suspense fallback={<WeekProgressSkeleton />}>
            <WeekProgress />
          </Suspense>
          <Suspense fallback={<ThisWeekSkeleton />}>
            <ThisWeek />
          </Suspense>
        </div>
      </div>
      <Suspense>
        <SignedInAs />
      </Suspense>
    </Page>
  );
}
