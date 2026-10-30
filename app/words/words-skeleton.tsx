import { LoadingBox } from "@/components/loading-box";
import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 8;

// The search bar and the boxed table while the library loads, at the size
// of the real ones.
export function WordsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>
      <LoadingBox label="Loading your words…" className="px-4">
        <div className="flex h-9 items-center justify-between border-b">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: ROWS }, (_, row) => (
          <div
            key={row}
            className="flex h-11 items-center justify-between border-b last:border-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </LoadingBox>
    </div>
  );
}
