import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// A bordered box of skeleton lines standing in for a card while it loads.
// Screen readers hear `label` instead of the empty shapes.
export function LoadingBox({
  label,
  className = "gap-3 p-4",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
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
