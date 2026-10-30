import type { ReactNode } from "react";

// One column on phones and tablets. From lg, the recap and weekly scores
// take the wider left column, streaks and most-missed words the right. The
// page and its loading placeholder share it, so they line up exactly.
export function ScoreboardColumns({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid w-full max-w-md gap-6 lg:max-w-none lg:grid-cols-[3fr_2fr] lg:items-start">
      <div className="flex flex-col gap-6">{left}</div>
      <div className="flex flex-col gap-6">{right}</div>
    </div>
  );
}
