import { describe, expect, it } from "vitest";
import { mostMissed } from "./missed";

describe("mostMissed", () => {
  it("counts each person's misses separately", () => {
    const result = mostMissed([
      { profileId: "a", word: "rhythm" },
      { profileId: "b", word: "rhythm" },
      { profileId: "a", word: "rhythm" },
    ]);
    expect(result.get("a")).toEqual([{ word: "rhythm", misses: 2 }]);
    expect(result.get("b")).toEqual([{ word: "rhythm", misses: 1 }]);
  });

  it("puts the most-missed first and breaks ties alphabetically", () => {
    const result = mostMissed([
      { profileId: "a", word: "liaison" },
      { profileId: "a", word: "accommodate" },
      { profileId: "a", word: "liaison" },
      { profileId: "a", word: "embarrass" },
    ]);
    expect(result.get("a")?.map((m) => m.word)).toEqual([
      "liaison",
      "accommodate",
      "embarrass",
    ]);
  });

  it("keeps only the top few", () => {
    const words = ["a", "b", "c", "d", "e"];
    const result = mostMissed(
      words.map((word) => ({ profileId: "a", word })),
      2,
    );
    expect(result.get("a")).toEqual([
      { word: "a", misses: 1 },
      { word: "b", misses: 1 },
    ]);
  });

  it("leaves out people with no misses", () => {
    expect(mostMissed([]).size).toBe(0);
  });
});
