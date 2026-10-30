import { CircleAlert, CircleCheck, CircleX } from "lucide-react";

import type { Mark } from "@/lib/session/share";
import { cn } from "@/lib/utils";

// A shape for each outcome (tick, alert, cross) so a result never relies on
// green, amber or red alone. Decorative: the label next to it says the same.
export function ResultIcon({
  mark,
  className,
}: {
  mark: Mark;
  className?: string;
}) {
  const [Icon, color] = mark.correct
    ? [CircleCheck, "text-success"]
    : mark.soClose
      ? [CircleAlert, "text-warning"]
      : [CircleX, "text-danger"];
  return (
    <Icon aria-hidden className={cn("size-4 shrink-0", color, className)} />
  );
}
