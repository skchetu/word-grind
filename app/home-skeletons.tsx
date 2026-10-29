import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Placeholders for the home page's boxes while they load, each the size of
// the box it stands in for, so nothing jumps when the real one arrives.
function Box({
  label,
  className = "gap-3 p-4",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn("flex w-full flex-col rounded-lg border", className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function DrillCardSkeleton() {
  return (
    <Box label="Loading today's drill…">
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

export function WeekProgressSkeleton() {
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
export function ThisWeekSkeleton() {
  return (
    <Box label="Loading this week's words…" className="gap-2 p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-2/3" />
    </Box>
  );
}

export function LineSkeleton() {
  return <Skeleton className="h-5 w-48" />;
}
