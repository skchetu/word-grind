import type { AlignStep } from "./align";

// One letter of the feedback diff. Tiles spell the correct word, plus any
// extra letters the speller typed, in reading order.
export type Tile =
  | { kind: "ok"; letter: string }
  | { kind: "wrong"; letter: string; typed: string }
  | { kind: "missing"; letter: string }
  | { kind: "extra"; letter: string }
  | { kind: "swapped"; letter: string };

export function toTiles(steps: AlignStep[]): Tile[] {
  return steps.flatMap((step): Tile[] => {
    switch (step.op) {
      case "keep":
        return [{ kind: "ok", letter: step.letter }];
      case "substitute":
        return [{ kind: "wrong", letter: step.expected, typed: step.typed }];
      case "insert":
        return [{ kind: "missing", letter: step.expected }];
      case "delete":
        return [{ kind: "extra", letter: step.typed }];
      case "swap":
        return Array.from(step.expected, (letter) => ({
          kind: "swapped" as const,
          letter,
        }));
    }
  });
}
