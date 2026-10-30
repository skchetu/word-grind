import { Suspense } from "react";

import { Page } from "@/components/page";

import { HomeColumns } from "./home-columns";
import { HomeSkeleton } from "./home-skeletons";
import { PendingTestsBanner } from "./pending-tests-banner";
import { PracticeCard } from "./practice-card";
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
      {/* One boundary for every box, so they all appear together. */}
      <Suspense fallback={<HomeSkeleton />}>
        <HomeColumns
          left={
            <>
              <PendingTestsBanner />
              <TodaysDrillCard />
              <PracticeCard />
              <TestCountdown />
            </>
          }
          right={
            <>
              <WeekProgress />
              <ThisWeek />
            </>
          }
        />
      </Suspense>
    </Page>
  );
}
