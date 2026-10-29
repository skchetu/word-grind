"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_LEVEL, MIN_LEVEL } from "@/lib/difficulty/adapt";

import { saveHousehold, type ProfileState } from "./actions";

const initialState: ProfileState = { status: "idle" };
const LEVELS = Array.from(
  { length: MAX_LEVEL - MIN_LEVEL + 1 },
  (_, i) => MIN_LEVEL + i,
);

export function HouseholdForm({
  name,
  difficulty,
}: {
  name: string;
  difficulty: number;
}) {
  const [state, formAction, pending] = useActionState(
    saveHousehold,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="name" className="text-sm font-medium">
        Household name
      </label>
      <Input id="name" name="name" defaultValue={name} required />
      <label htmlFor="difficulty" className="text-sm font-medium">
        Difficulty
      </label>
      <select
        id="difficulty"
        name="difficulty"
        defaultValue={difficulty}
        aria-describedby="difficulty-hint"
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
            {level === MIN_LEVEL && " (easiest)"}
            {level === MAX_LEVEL && " (hardest)"}
          </option>
        ))}
      </select>
      <p id="difficulty-hint" className="text-sm text-muted-foreground">
        Shared by everyone in the household. Monday&apos;s list aims for this
        level.
      </p>
      <Button type="submit" disabled={pending} className="md:self-start">
        {pending ? "Saving…" : "Save household"}
      </Button>
      <p
        role="status"
        className={
          state.status === "error"
            ? "text-sm text-destructive"
            : "text-sm text-muted-foreground"
        }
      >
        {state.status === "saved" && "Saved."}
        {state.status === "error" && state.message}
      </p>
    </form>
  );
}
