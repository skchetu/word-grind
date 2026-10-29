import { cn } from "@/lib/utils";

// Three column widths shared by every signed-in page and the header:
// wide (64rem) for dashboards, reading (42rem) for lists and forms, and
// focus (28rem) for one task at a time, like a drill or a test.
const WIDTHS = {
  wide: "max-w-5xl",
  reading: "max-w-2xl",
  focus: "max-w-md",
} as const;

export type PageWidth = keyof typeof WIDTHS;
export const WIDE = WIDTHS.wide;

export function Page({
  width,
  className,
  children,
}: {
  width: PageWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-1 flex-col items-center gap-6 px-4 pt-6 pb-8 md:pt-10",
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </main>
  );
}
