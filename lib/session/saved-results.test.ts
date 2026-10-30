import { describe, expect, it } from "vitest";

import { savedAttemptsSchema } from "./saved-results";

const attempt = (word: string, typed: string, distance: number) => ({
  word_id: word,
  typed,
  correct: distance === 0,
  edit_distance: distance,
  used_hint: false,
  words: { text: word },
});

describe("savedAttemptsSchema", () => {
  it("rebuilds the words and results, marking one letter off as so close", () => {
    const { words, results } = savedAttemptsSchema.parse([
      attempt("rhythm", "rhythm", 0),
      attempt("necessary", "neccessary", 1),
      attempt("separate", "seperete", 2),
    ]);
    expect(words).toEqual([
      { id: "rhythm", text: "rhythm" },
      { id: "necessary", text: "necessary" },
      { id: "separate", text: "separate" },
    ]);
    expect(results.map((r) => [r.answer, r.correct, r.soClose])).toEqual([
      ["rhythm", true, false],
      ["neccessary", false, true],
      ["seperete", false, false],
    ]);
  });
});
