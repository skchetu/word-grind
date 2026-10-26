import { describe, expect, it } from "vitest";
import { currentStreak } from "./streak";

const today = "2026-10-26";

describe("currentStreak", () => {
  it("counts days in a row ending today", () => {
    const days = new Set(["2026-10-24", "2026-10-25", "2026-10-26"]);
    expect(currentStreak(days, today)).toBe(3);
  });

  it("keeps yesterday's streak alive until today ends", () => {
    const days = new Set(["2026-10-24", "2026-10-25"]);
    expect(currentStreak(days, today)).toBe(2);
  });

  it("breaks after a missed day", () => {
    expect(currentStreak(new Set(["2026-10-24"]), today)).toBe(0);
    const gap = new Set(["2026-10-22", "2026-10-24", "2026-10-25"]);
    expect(currentStreak(gap, today)).toBe(2);
  });

  it("runs across a month boundary", () => {
    const days = new Set(["2026-10-31", "2026-11-01"]);
    expect(currentStreak(days, "2026-11-01")).toBe(2);
  });
});
