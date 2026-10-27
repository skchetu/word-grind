import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  adaptDifficulty,
  clampLevel,
  householdTally,
  levelChange,
  MAX_LEVEL,
  MIN_LEVEL,
} from "./adapt";

const tally = (correct: number, total = 20) => ({ correct, total });

describe("adaptDifficulty", () => {
  it("moves up one level at 85% or better", () => {
    expect(adaptDifficulty(3, tally(17))).toBe(4); // exactly 85%
    expect(adaptDifficulty(3, tally(20))).toBe(4);
  });

  it("moves down one level at 60% or worse", () => {
    expect(adaptDifficulty(3, tally(12))).toBe(2); // exactly 60%
    expect(adaptDifficulty(3, tally(0))).toBe(2);
  });

  it("stays put in between", () => {
    expect(adaptDifficulty(3, tally(13))).toBe(3);
    expect(adaptDifficulty(3, tally(16))).toBe(3);
  });

  it("never goes past the top or bottom level", () => {
    expect(adaptDifficulty(MAX_LEVEL, tally(20))).toBe(MAX_LEVEL);
    expect(adaptDifficulty(MIN_LEVEL, tally(0))).toBe(MIN_LEVEL);
  });

  it("leaves the level alone when nobody took the test", () => {
    expect(adaptDifficulty(4, { correct: 0, total: 0 })).toBe(4);
  });

  it("always returns a whole level within range, at most one step away", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_LEVEL, max: MAX_LEVEL }),
        fc.nat(50),
        fc.nat(50),
        (level, a, b) => {
          const next = adaptDifficulty(level, {
            correct: Math.min(a, b),
            total: Math.max(a, b),
          });
          expect(Number.isInteger(next)).toBe(true);
          expect(next).toBeGreaterThanOrEqual(MIN_LEVEL);
          expect(next).toBeLessThanOrEqual(MAX_LEVEL);
          expect(Math.abs(next - level)).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});

describe("householdTally", () => {
  it("adds everyone's answers together", () => {
    // 15/15 and 9/15 average out to 80%, so the level holds.
    const both = householdTally([tally(15, 15), tally(9, 15)]);
    expect(both).toEqual({ correct: 24, total: 30 });
    expect(adaptDifficulty(3, both)).toBe(3);
  });

  it("is empty when nobody took the test", () => {
    expect(householdTally([])).toEqual({ correct: 0, total: 0 });
  });
});

describe("clampLevel", () => {
  it("rounds and keeps a stored level in range", () => {
    expect(clampLevel(0)).toBe(MIN_LEVEL);
    expect(clampLevel(9)).toBe(MAX_LEVEL);
    expect(clampLevel(2.6)).toBe(3);
  });
});

describe("levelChange", () => {
  it("says which way the level moved", () => {
    expect(levelChange(3, 4)).toBe("Next week: level 4 (up from 3)");
    expect(levelChange(3, 2)).toBe("Next week: level 2 (down from 3)");
    expect(levelChange(3, 3)).toBe("Next week: level 3 (no change)");
  });

  it("gives just the level when the previous one wasn't recorded", () => {
    expect(levelChange(null, 4)).toBe("Next week: level 4");
  });
});
