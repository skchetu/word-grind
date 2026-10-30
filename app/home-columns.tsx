import type { ReactNode } from "react";

// One column on phones and tablets, in the same order as before. From lg,
// today's tasks sit on the left and the week's progress on the right. The
// page and its loading placeholder share it, so they line up exactly.
export function HomeColumns({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid w-full max-w-md gap-6 lg:max-w-none lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col items-center gap-6 lg:items-start">
        {left}
      </div>
      <div className="flex flex-col gap-6">{right}</div>
    </div>
  );
}
