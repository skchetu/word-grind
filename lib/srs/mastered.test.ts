import { describe, expect, it } from "vitest";
import { masteredCounts } from "./mastered";

const week = new Set(["w1", "w2"]);

describe("masteredCounts", () => {
  it("counts words in box 4 or higher, per person", () => {
    const counts = masteredCounts(
      [
        { profileId: "a", wordId: "w1", box: 4 },
        { profileId: "a", wordId: "w2", box: 5 },
        { profileId: "b", wordId: "w1", box: 3 },
      ],
      week,
    );
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBeUndefined();
  });

  it("ignores words from other weeks", () => {
    const counts = masteredCounts(
      [{ profileId: "a", wordId: "old", box: 5 }],
      week,
    );
    expect(counts.size).toBe(0);
  });
});
