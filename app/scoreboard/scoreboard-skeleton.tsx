import { LoadingBox } from "@/components/loading-box";
import { Skeleton } from "@/components/ui/skeleton";

import { ScoreboardColumns } from "./scoreboard-columns";

// Two boxes side by side, one per person, like the streaks and most-missed
// words.
function PairSkeleton({ label, lines }: { label: string; lines: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <LoadingBox key={i} label={label} className="gap-2 p-4">
          {Array.from({ length: lines }, (_, line) => (
            <Skeleton key={line} className="h-4 w-3/4" />
          ))}
        </LoadingBox>
      ))}
    </div>
  );
}

// The whole scoreboard while it loads, laid out like the real one, so every
// box appears at once instead of popping in one by one.
export function ScoreboardSkeleton() {
  return (
    <ScoreboardColumns
      left={
        <>
          <LoadingBox label="Loading the weekly recap…">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </LoadingBox>
          <LoadingBox label="Loading weekly scores…" className="gap-4 p-4">
            <Skeleton className="mx-auto h-4 w-40" />
            <Skeleton className="h-36 w-full" />
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-5 w-full" />
            ))}
          </LoadingBox>
        </>
      }
      right={
        <>
          <PairSkeleton label="Loading streaks…" lines={3} />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-48" />
            <PairSkeleton label="Loading most-missed words…" lines={4} />
          </div>
        </>
      }
    />
  );
}
