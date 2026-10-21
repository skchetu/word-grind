"use client";

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
// which key was pressed.
export function SpellInput({
  value,
  onChange,
  onReplay,
  className,
}: SpellInputProps) {
  return (
    <Input
      autoFocus
      aria-label="Your spelling"
      aria-describedby="spell-input-help"
      value={value}
      onChange={(e) => {
        const { text, replay } = readTyped(value, e.target.value);
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
