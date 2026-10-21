import { describe, expect, it } from "vitest";

import { DAILY_LIMITS, isOverLimit, limitWindowStart } from "./limits";

describe("limitWindowStart", () => {
  it("is exactly 24 hours earlier", () => {
    const now = new Date("2026-10-21T08:30:00Z");
    expect(limitWindowStart(now)).toBe("2026-10-20T08:30:00.000Z");
  });
});

describe("isOverLimit", () => {
  it("allows calls up to the limit and blocks the next", () => {
    const limit = DAILY_LIMITS.week;
    expect(isOverLimit("week", 0)).toBe(false);
    expect(isOverLimit("week", limit - 1)).toBe(false);
    expect(isOverLimit("week", limit)).toBe(true);
  });

  it("uses each feature's own limit", () => {
    expect(isOverLimit("tip", DAILY_LIMITS.week)).toBe(false);
  });
});
