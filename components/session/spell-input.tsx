"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { readTyped } from "@/lib/session/typed";
import { cn } from "@/lib/utils";

type SpellInputProps = {
  value: string;
  onChange: (value: string) => void;
  onReplay: () => void;
  className?: string;
};

// The answer box. Everything the browser would do to "help" (autocorrect,
// spellcheck, capitalising, autofill) is off, or it would spell the word
// for you. Space replays the word instead of typing; this is handled in
// onChange rather than onKeyDown because Android keyboards don't report
// which key was pressed. Android keyboards still offer suggestions, so a
// tapped suggestion is ignored and a note says why.
export function SpellInput({
  value,
  onChange,
  onReplay,
  className,
}: SpellInputProps) {
  const [blocked, setBlocked] = useState(false);
  return (
    <>
      <Input
        autoFocus
        aria-label="Your spelling"
        aria-describedby="spell-input-help"
        value={value}
        onChange={(e) => {
          const { text, replay, blocked } = readTyped(value, e.target.value);
          setBlocked(blocked);
          if (replay) onReplay();
          else if (text !== value) onChange(text);
        }}
        type="text"
        inputMode="text"
        enterKeyHint="go"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="none"
        autoComplete="off"
        data-1p-ignore
        className={cn(
          "h-14 text-center font-mono text-2xl tracking-wider caret-primary md:text-2xl",
          className,
        )}
      />
      {blocked && (
        <p role="status" className="text-center text-sm text-warning">
          Keyboard suggestions don&apos;t count. Type one letter at a time.
        </p>
      )}
    </>
  );
}

export function SpellInputHelp() {
  return (
    <p
      id="spell-input-help"
      className="text-center text-sm text-muted-foreground"
    >
      Press Space before typing to hear it again, Enter to submit.
    </p>
  );
}
