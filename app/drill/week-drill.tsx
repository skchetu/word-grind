import Link from "next/link";

import { BasicDrill } from "@/components/session/basic-drill";
import { Button } from "@/components/ui/button";
import { seedWords } from "@/data/seed-words";

import { todaysDrill } from "./todays-drill";

// Today's drill. Uses the seed words until the household has a list.
// Returning words get a fresh sentence first, which can take a moment.
// Reads the session, so it renders per request behind a Suspense boundary.
export async function WeekDrill() {
  const drill = await todaysDrill({ freshSentences: true });
  if (!drill) return <BasicDrill words={seedWords} />;

  if (drill.words.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">
          No words due today. Come back tomorrow.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    );
  }
  return <BasicDrill words={drill.words} weekId={drill.weekId} />;
}
