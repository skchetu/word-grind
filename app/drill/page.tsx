import type { Metadata } from "next";

import { BasicDrill } from "@/components/session/basic-drill";
import { seedWords } from "@/data/seed-words";

export const metadata: Metadata = { title: "Drill · Word Grind" };

export default function DrillPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Daily drill</h1>
      <BasicDrill words={seedWords} />
    </main>
  );
}
