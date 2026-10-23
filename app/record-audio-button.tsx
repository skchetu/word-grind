"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { recordThisWeekAudio } from "./actions";

// Recording a week's clips takes ElevenLabs a few seconds per word.
export function RecordAudio({ count }: { count: number }) {
  const [error, action] = useActionState(() => recordThisWeekAudio(), null);

  return (
    <form action={action} className="mt-4">
      <RecordAudioButton count={count} error={error} />
    </form>
  );
}

function RecordAudioButton({
  count,
  error,
}: {
  count: number;
  error: string | null;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Recording audio…" : "Record audio"}
      </Button>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {pending
          ? "This can take up to a minute."
          : `${count} ${count === 1 ? "word doesn't" : "words don't"} have recorded audio yet.`}
      </p>
      {error && !pending && (
        <p role="alert" className="text-sm break-words text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
