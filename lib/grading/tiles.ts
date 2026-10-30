import type { AlignStep } from "./align";

// One tile of the feedback diff. `gap` is an empty box where a letter is
// missing, and `fix` marks a correct letter the answer got wrong or left out.
export type Tile = {
  letter: string;
  kind: "ok" | "wrong" | "gap" | "extra" | "swapped" | "fix";
};

// One step of the diff as a typed tile above a correct one. An extra letter
// has no correct tile.
type Column = { typed: Tile; correct: Tile | null };

// The two rows of the diff: what was typed, then the correct spelling. The
// correct row skips extra letters, so it reads as the plain word.
export function toRows(steps: AlignStep[]) {
  const columns = toColumns(steps);
  return {
    typed: columns.map((c) => c.typed),
    correct: columns.flatMap((c) => (c.correct ? [c.correct] : [])),
  };
}

function toColumns(steps: AlignStep[]): Column[] {
  return steps.flatMap((step): Column[] => {
    switch (step.op) {
      case "keep": {
        const tile = { letter: step.letter, kind: "ok" } as const;
        return [{ typed: tile, correct: tile }];
      }
      case "substitute":
        return [
          {
            typed: { letter: step.typed, kind: "wrong" },
            correct: { letter: step.expected, kind: "fix" },
          },
        ];
      case "insert":
        return [
          {
            typed: { letter: "", kind: "gap" },
            correct: { letter: step.expected, kind: "fix" },
          },
        ];
      case "delete":
        return [
          { typed: { letter: step.typed, kind: "extra" }, correct: null },
        ];
      case "swap":
        return Array.from(step.expected, (letter, k) => ({
          typed: { letter: step.typed[k] ?? "", kind: "swapped" },
          correct: { letter, kind: "fix" },
        }));
    }
  });
}
