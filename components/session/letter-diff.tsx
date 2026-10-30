import { align } from "@/lib/grading/align";
import { type Tile, toRows } from "@/lib/grading/tiles";
import { cn } from "@/lib/utils";

const STAGGER_MS = 30;

const style: Record<Tile["kind"], string> = {
  ok: "border-transparent",
  wrong: "border-danger bg-danger-subtle text-danger",
  gap: "border-danger bg-danger-subtle",
  extra: "border-danger/60 text-danger/70 line-through",
  swapped: "border-warning bg-warning-subtle text-warning",
  fix: "border-success bg-success-subtle text-success",
};

// The answer above the correct spelling. Both rows start at the same place,
// and the correct row leaves out extra letters, so it reads as the word. Each
// row can be read on its own, so colour is never the only clue. Tiles flip
// in one after another unless the user prefers reduced motion. Screen
// readers get the spelling letter by letter instead of the tiles.
export function LetterDiff({ answer, word }: { answer: string; word: string }) {
  const { typed, correct } = toRows(align(answer, word));
  const rows = [
    { label: "You typed", tiles: typed },
    { label: "Correct spelling", tiles: correct },
  ];
  return (
    <div>
      <p className="sr-only">
        The correct spelling is {Array.from(word).join("-")}.
      </p>
      <div
        aria-hidden
        className="grid items-center justify-center gap-x-0.5 gap-y-1 font-mono text-[clamp(1rem,5vw,1.5rem)]"
        style={{
          gridTemplateColumns: `auto repeat(${typed.length}, minmax(0, 2rem))`,
        }}
      >
        {rows.map((row, r) => [
          <span
            key={`label-${r}`}
            className="w-16 pr-2 font-sans text-xs leading-tight text-muted-foreground sm:w-auto"
          >
            {row.label}
          </span>,
          ...row.tiles.map((tile, i) => (
            <span
              key={`${r}-${i}`}
              className={cn(
                "flex aspect-[4/5] w-full items-center justify-center rounded-md border-2 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50 motion-safe:fill-mode-both",
                style[tile.kind],
              )}
              style={{ animationDelay: `${i * STAGGER_MS}ms` }}
            >
              {/* An empty tile still gets a line of text, so it's as tall as the rest. */}
              {tile.letter || "\u00a0"}
            </span>
          )),
        ])}
      </div>
    </div>
  );
}
