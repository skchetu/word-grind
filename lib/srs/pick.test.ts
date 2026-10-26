import { describe, expect, it } from "vitest";

import { drillMinutes, pickDrillWords } from "./pick";

const w = (id: string) => ({ id });

describe("pickDrillWords", () => {
  it("puts due words first, most overdue first, then unseen week words", () => {
    const picked = pickDrillWords(
      [
        { word: w("b"), dueOn: "2026-10-22" },
        { word: w("a"), dueOn: "2026-10-20" },
      ],
      [w("a"), w("c"), w("d")],
      new Set(["a", "b"]),
    );
    expect(picked.map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("skips week words that were reviewed and aren't due", () => {
    const picked = pickDrillWords([], [w("a"), w("b")], new Set(["a"]));
    expect(picked.map((x) => x.id)).toEqual(["b"]);
  });

  it("stops at the cap", () => {
    const week = Array.from({ length: 20 }, (_, i) => w(`w${i}`));
    expect(pickDrillWords([], week, new Set())).toHaveLength(15);
    expect(pickDrillWords([], week, new Set(), 3)).toHaveLength(3);
  });
});

describe("drillMinutes", () => {
  it("estimates about five minutes for a full drill", () => {
    expect(drillMinutes(15)).toBe(5);
  });

  it("never says less than a minute", () => {
    expect(drillMinutes(1)).toBe(1);
    expect(drillMinutes(0)).toBe(1);
  });
});
