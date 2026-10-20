import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  addDays,
  initialState,
  isDue,
  isMastered,
  reviewStateSchema,
  schedule,
  type ReviewState,
} from "./schedule";

const today = "2026-10-20";
const inBox = (box: number): ReviewState => ({
  box,
  dueOn: today,
  correctStreak: 0,
  lapses: 0,
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-25", 14)).toBe("2027-01-08");
  });

  it("is unaffected by daylight saving changes", () => {
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });
});

describe("schedule", () => {
  it("moves a correct word up one box and spaces it out", () => {
    expect(schedule(inBox(1), true, today)).toMatchObject({
      box: 2,
      dueOn: "2026-10-22",
      correctStreak: 1,
    });
    expect(schedule(inBox(3), true, today).dueOn).toBe("2026-10-27");
  });

  it("keeps a word in box 5 at the longest interval", () => {
    expect(schedule(inBox(5), true, today)).toMatchObject({
      box: 5,
      dueOn: "2026-11-03",
    });
  });

  it("sends a missed word back to box 1 for tomorrow", () => {
    const missed = schedule(
      { box: 4, dueOn: today, correctStreak: 3, lapses: 1 },
      false,
      today,
    );
    expect(missed).toEqual({
      box: 1,
      dueOn: "2026-10-21",
      correctStreak: 0,
      lapses: 2,
    });
  });

  it("always keeps the box between 1 and 5", () => {
    const answers = fc.array(fc.boolean(), { maxLength: 50 });
    fc.assert(
      fc.property(answers, (results) => {
        let state = initialState(today);
        for (const correct of results) {
          state = schedule(state, correct, today);
          expect(state.box).toBeGreaterThanOrEqual(1);
          expect(state.box).toBeLessThanOrEqual(5);
        }
      }),
    );
  });

  it("always produces a valid review state", () => {
    const states = fc.record({
      box: fc.integer({ min: 1, max: 5 }),
      dueOn: fc.constant(today),
      correctStreak: fc.nat(100),
      lapses: fc.nat(100),
    });
    fc.assert(
      fc.property(states, fc.boolean(), (state, correct) => {
        const next = schedule(state, correct, today);
        expect(reviewStateSchema.safeParse(next).success).toBe(true);
        expect(next.dueOn > today).toBe(true);
      }),
    );
  });
});

describe("isDue and isMastered", () => {
  it("treats a word as due on or after its date", () => {
    expect(isDue(inBox(2), today)).toBe(true);
    expect(isDue({ ...inBox(2), dueOn: "2026-10-21" }, today)).toBe(false);
  });

  it("counts box 4 and up as mastered", () => {
    expect(isMastered(inBox(3))).toBe(false);
    expect(isMastered(inBox(4))).toBe(true);
  });
});
