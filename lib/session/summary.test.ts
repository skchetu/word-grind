import { describe, expect, it } from "vitest";

import type { Result } from "./machine";
import { summarize } from "./summary";

const result = (wordId: string, correct: boolean): Result => ({
  wordId,
  answer: wordId,
  correct,
  distance: correct ? 0 : 2,
  soClose: false,
  hintUsed: false,
});

describe("summarize", () => {
  it("scores the session and lists missed words first, in order", () => {
    const s = summarize([
      result("a", true),
      result("b", false),
      result("c", true),
      result("d", false),
    ]);
    expect(s).toMatchObject({ correct: 2, total: 4 });
    expect(s.rows.map((r) => r.wordId)).toEqual(["b", "d", "a", "c"]);
  });

  it("handles a perfect session", () => {
    const s = summarize([result("a", true)]);
    expect(s).toMatchObject({ correct: 1, total: 1 });
  });
});
