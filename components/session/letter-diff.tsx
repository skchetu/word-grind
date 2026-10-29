import { align } from "@/lib/grading/align";
import { toTiles, type Tile } from "@/lib/grading/tiles";
import { cn } from "@/lib/utils";

const STAGGER_MS = 30;

const style: Record<Tile["kind"], string> = {
  ok: "border-transparent",
  wrong: "border-danger bg-danger-subtle text-danger",
  missing: "border-success bg-success-subtle text-success",
  extra: "border-danger/60 text-danger/70 line-through",
  swapped: "border-warning bg-warning-subtle text-warning",
};

// Tiles shrink to fit long words on a phone, so marks stay one character.
const mark = (tile: Tile) =>
  tile.kind === "wrong"
    ? tile.typed
    : { ok: "", missing: "+", extra: "×", swapped: "⇄" }[tile.kind];

const legend: Partial<Record<Tile["kind"], string>> = {
  missing: "+ missing",
  extra: "× extra",
  swapped: "⇄ swapped",
  wrong: "small letter: what you typed",
};

// The answer lined up against the correct spelling, one tile per letter.
// Tiles flip in one after another unless the user prefers reduced motion.
// Screen readers get the spelling letter by letter instead of the tiles.
export function LetterDiff({ answer, word }: { answer: string; word: string }) {
  const tiles = toTiles(align(answer, word));
  return (
    <div>
      <p className="sr-only">
        The correct spelling is {Array.from(word).join("-")}.
      </p>
      <ol
        aria-hidden
        className="grid justify-center gap-0.5 font-mono text-[clamp(1rem,5vw,1.5rem)]"
        style={{
          gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 2rem))`,
        }}
      >
        {tiles.map((tile, i) => (
          <li
            key={i}
            className="flex flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50 motion-safe:fill-mode-both"
            style={{ animationDelay: `${i * STAGGER_MS}ms` }}
          >
            <span
              className={cn(
                "flex aspect-[4/5] w-full items-center justify-center rounded-md border-2",
                style[tile.kind],
              )}
            >
              {tile.letter}
            </span>
            <span className="h-4 text-xs leading-4 text-muted-foreground">
              {mark(tile)}
            </span>
          </li>
        ))}
      </ol>
      <p aria-hidden className="mt-1 text-center text-xs text-muted-foreground">
        {[...new Set(tiles.map((t) => legend[t.kind]))]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}
