"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Recording a week's clips takes ElevenLabs a few seconds per word.
export function RecordAudioButton({ count }: { count: number }) {
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
    </div>
  );
}
