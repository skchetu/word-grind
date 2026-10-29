import { describe, expect, it } from "vitest";

import { formatClock, milestoneNote, msLeft, TEST_MS } from "./timer";

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

describe("milestoneNote", () => {
  const min = 60_000;

  it("stays quiet with more than ten minutes left", () => {
    expect(milestoneNote(TEST_MS)).toBeNull();
    expect(milestoneNote(10 * min + 1)).toBeNull();
  });

  it("names the latest milestone passed", () => {
    expect(milestoneNote(10 * min)).toBe("10 minutes left");
    expect(milestoneNote(6 * min)).toBe("10 minutes left");
    expect(milestoneNote(5 * min)).toBe("5 minutes left");
    expect(milestoneNote(1 * min)).toBe("1 minute left");
    expect(milestoneNote(0)).toBe("1 minute left");
  });
});
