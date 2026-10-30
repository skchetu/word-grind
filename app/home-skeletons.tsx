import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBox as Box } from "@/components/loading-box";

import { HomeColumns } from "./home-columns";

// Placeholders for the home page's boxes while they load, each the size of
// the box it stands in for, so nothing jumps when the real ones arrive.

// A heading, then a line of text beside a small button: the test, drill and
// practice cards all share this shape.
function CardSkeleton({ label }: { label: string }) {
  return (
    <Box label={label}>
      <div className="flex h-6 items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-16" />
      </div>
    </Box>
  );
}

function WeekProgressSkeleton() {
  return (
    <Box label="Loading this week's progress…" className="px-4 py-1">
      {["h-10", "h-11", "h-11"].map((height, row) => (
        <div
          key={row}
          className={`flex ${height} items-center justify-between`}
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </Box>
  );
}

// Two title lines, since most themes wrap on a phone.
function ThisWeekSkeleton() {
  return (
    <Box label="Loading this week's words…" className="gap-2 p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-2/3" />
    </Box>
  );
}

function LineSkeleton() {
  return <Skeleton className="h-5 w-48" />;
}

// The whole home page while it loads, laid out like the real one, so every
// box appears at once instead of popping in one by one.
export function HomeSkeleton() {
  return (
    <HomeColumns
      left={
        <>
          <CardSkeleton label="Loading your tests…" />
          <CardSkeleton label="Loading today's drill…" />
          <CardSkeleton label="Loading practice…" />
          <LineSkeleton />
        </>
      }
      right={
        <>
          <WeekProgressSkeleton />
          <ThisWeekSkeleton />
        </>
      }
    />
  );
}
