import Link from "next/link";

import { Button } from "@/components/ui/button";

// A way back to this week's words after the daily drill is done. Static, so
// it never waits on the database.
export function PracticeCard() {
  return (
    <section
      aria-labelledby="practice-heading"
      className="w-full rounded-lg border p-4 text-left"
    >
      <h2 id="practice-heading" className="font-semibold">
        Practice
      </h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          This week&apos;s words in random order, as often as you like.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/practice">Practice</Link>
        </Button>
      </div>
    </section>
  );
}
