import { describe, expect, it } from "vitest";

import { savedProgress } from "./progress";

const words = [
  { id: "w1", text: "rhythm" },
  { id: "w2", text: "receive" },
  { id: "w3", text: "liaison" },
];
const done = {
  wordId: "w1",
  answer: "rhythm",
  correct: true,
  distance: 0,
  soClose: false,
  hintUsed: false,
};
const saved = (over: object = {}) =>
  JSON.stringify({
    day: "2026-10-28",
    wordIds: ["w1", "w2", "w3"],
    results: [done],
    answerMs: [4200],
    ...over,
  });

describe("savedProgress", () => {
  it("resumes today's drill on the same words", () => {
    expect(savedProgress(saved(), "2026-10-28", words)).toEqual({
      results: [done],
      answerMs: [4200],
    });
  });

  it("starts fresh on another day or with different words", () => {
    expect(savedProgress(saved(), "2026-10-29", words)).toBeNull();
    expect(
      savedProgress(
        saved({ wordIds: ["w1", "w3", "w2"] }),
        "2026-10-28",
        words,
      ),
    ).toBeNull();
  });

  it("starts fresh when nothing usable was saved", () => {
    expect(savedProgress(null, "2026-10-28", words)).toBeNull();
    expect(savedProgress("not json", "2026-10-28", words)).toBeNull();
    expect(
      savedProgress(saved({ results: [] }), "2026-10-28", words),
    ).toBeNull();
    expect(
      savedProgress(saved({ results: "oops" }), "2026-10-28", words),
    ).toBeNull();
    const finished = words.map((w) => ({ ...done, wordId: w.id }));
    expect(
      savedProgress(saved({ results: finished }), "2026-10-28", words),
    ).toBeNull();
  });
});
