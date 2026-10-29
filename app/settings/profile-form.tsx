"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { saveProfile, type ProfileState } from "./actions";

const initialState: ProfileState = { status: "idle" };

export function ProfileForm({
  displayName,
  topics,
}: {
  displayName: string;
  topics: string[];
}) {
  const [state, formAction, pending] = useActionState(
    saveProfile,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <label htmlFor="displayName" className="text-sm font-medium">
        Name
      </label>
      <Input
        id="displayName"
        name="displayName"
        defaultValue={displayName}
        autoComplete="nickname"
        required
      />
      <label htmlFor="topics" className="text-sm font-medium">
        Topics for example sentences
      </label>
      <Input
        id="topics"
        name="topics"
        defaultValue={topics.join(", ")}
        placeholder="food, travel, tech"
        aria-describedby="topics-hint"
      />
      <p id="topics-hint" className="text-sm text-muted-foreground">
        Separate topics with commas. Claude uses them in next week&apos;s
        sentences.
      </p>
      <Button type="submit" disabled={pending} className="md:self-start">
        {pending ? "Saving…" : "Save"}
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
