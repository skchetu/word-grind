"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

// The week's heading with a toggle that shows or hides its word list. It
// replaces a <details>, because the theme's ⓘ button sat inside the
// <summary>, and a button inside another control is hard to reach with a
// screen reader. Tapping the heading text still toggles, as before; the
// chevron is the real button for keyboards and screen readers.
export function WeekDisclosure({
  heading,
  children,
}: {
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <>
      <div
        className="flex cursor-pointer items-start justify-between gap-3"
        onClick={(event) => {
          // The ⓘ and the chevron handle their own clicks.
          if ((event.target as HTMLElement).closest("button")) return;
          setOpen((value) => !value);
        }}
      >
        <div>{heading}</div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={
            open ? "Hide this week's words" : "Show this week's words"
          }
          onClick={() => setOpen((value) => !value)}
          className="-m-1 rounded-md p-1 text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronDown
            aria-hidden
            className={`size-5 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      <div id={listId} hidden={!open}>
        {children}
      </div>
    </>
  );
}
