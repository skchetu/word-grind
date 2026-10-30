import type { AlignStep } from "./align";

// One tile of the feedback diff. `gap` is an empty box where a letter is
// missing, and `fix` marks a correct letter the answer got wrong or left out.
export type Tile = {
  letter: string;
  kind: "ok" | "wrong" | "gap" | "extra" | "swapped" | "fix";
};

// One column of the two-row diff: what was typed above the correct spelling.
// A row is null where it has no letter, such as the correct row under an
// extra letter.
export type Column = { typed: Tile | null; correct: Tile | null };

export function toColumns(steps: AlignStep[]): Column[] {
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
