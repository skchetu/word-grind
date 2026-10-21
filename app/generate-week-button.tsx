"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Writing a list takes Claude up to a minute, so the button says so.
export function GenerateWeekButton() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Writing this week's list…" : "Generate this week's list"}
      </Button>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {pending && "This can take up to a minute."}
      </p>
    </div>
  );
}
