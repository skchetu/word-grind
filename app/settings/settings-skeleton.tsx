import { LoadingBox } from "@/components/loading-box";
import { Skeleton } from "@/components/ui/skeleton";

// A label above a field, like each setting in the forms.
function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

// The three settings cards while they load, roughly the size of the real
// forms, so the page doesn't jump when they arrive.
export function SettingsSkeleton() {
  return (
    <>
      <LoadingBox label="Loading your settings…" className="gap-4 p-4">
        <Skeleton className="h-6 w-12" />
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-9 w-full md:w-20" />
      </LoadingBox>
      <LoadingBox label="Loading this device's settings…" className="gap-4 p-4">
        <Skeleton className="h-6 w-28" />
        <FieldSkeleton />
      </LoadingBox>
      <LoadingBox label="Loading household settings…" className="gap-4 p-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-9 w-full md:w-32" />
      </LoadingBox>
    </>
  );
}
