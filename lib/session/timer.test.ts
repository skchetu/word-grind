import { describe, expect, it } from "vitest";

import { formatClock, msLeft, TEST_MS } from "./timer";

describe("msLeft", () => {
  it("counts down from an hour and stops at zero", () => {
    expect(msLeft(1000, 1000)).toBe(TEST_MS);
    expect(msLeft(1000, 1000 + 90_000)).toBe(TEST_MS - 90_000);
    expect(msLeft(1000, 1000 + TEST_MS + 5000)).toBe(0);
  });
});

describe("formatClock", () => {
  it("shows minutes and padded seconds", () => {
    expect(formatClock(TEST_MS)).toBe("60:00");
    expect(formatClock(7 * 60_000 + 5000)).toBe("7:05");
  });

  it("rounds up, so it only reads 0:00 at the very end", () => {
    expect(formatClock(1)).toBe("0:01");
    expect(formatClock(0)).toBe("0:00");
  });
});
