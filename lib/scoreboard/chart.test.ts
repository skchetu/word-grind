import { describe, expect, it } from "vitest";
import { chartWeeks } from "./chart";
import type { WeekScores } from "./weekly";

const row = (id: string, results: WeekScores["results"]): WeekScores => ({
  id,
  startsOn: `2026-10-${id}`,
  results,
});

describe("chartWeeks", () => {
  it("keeps the latest weeks, oldest first", () => {
    const rows = [row("26", {}), row("19", {}), row("12", {})];
    expect(chartWeeks(rows, [], 2).map((w) => w.id)).toEqual(["19", "26"]);
  });

  it("gives each member a percentage, or null when not taken", () => {
    const rows = [
      row("19", { a: { score: 8, total: 10, late: false } }),
      row("12", { b: { score: 13, total: 15, late: true } }),
    ];
    expect(chartWeeks(rows, ["a", "b"]).map((w) => w.percents)).toEqual([
      [null, 87],
      [80, null],
    ]);
  });
});
