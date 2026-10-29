"use client";

import { Info } from "lucide-react";
import { useRef, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// An ⓘ beside the week's theme that explains it in plain words. It opens on
// hover with a mouse, and on a tap on phones, which have no hover.
export function ThemeNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  const hovering = useRef(false);
  function hover(event: React.PointerEvent, next: boolean) {
    if (event.pointerType !== "mouse") return;
    hovering.current = next;
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="What this theme means"
        onPointerEnter={(event) => hover(event, true)}
        onPointerLeave={(event) => hover(event, false)}
        // Inside the list's <summary>, so a tap here shouldn't also open the
        // list. A click while hovering keeps it open rather than closing it.
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => hovering.current || !value);
        }}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Info className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        className="text-sm"
        collisionPadding={16}
        onPointerLeave={(event) => hover(event, false)}
      >
        {note}
      </PopoverContent>
    </Popover>
  );
}
