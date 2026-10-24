import { describe, expect, it } from "vitest";
import { pendingTests, testDay } from "./pending-tests";

const w1 = { id: "w1", startsOn: "2026-10-12" }; // test on Oct 18
const w2 = { id: "w2", startsOn: "2026-10-19" }; // test on Oct 25
const w3 = { id: "w3", startsOn: "2026-10-26" }; // test on Nov 1

describe("testDay", () => {
  it("is the Sunday of the week", () => {
    expect(testDay("2026-10-19")).toBe("2026-10-25");
    expect(testDay("2026-12-28")).toBe("2027-01-03");
  });
});

describe("pendingTests", () => {
  it("opens this week's test on Sunday, not before", () => {
    expect(pendingTests([w2], new Set(), "2026-10-24")).toEqual([]);
    expect(pendingTests([w2], new Set(), "2026-10-25")).toEqual([w2]);
  });

  it("keeps a missed test open, oldest first, until it's taken", () => {
    const weeks = [w3, w1, w2];
    expect(pendingTests(weeks, new Set(), "2026-10-28")).toEqual([w1, w2]);
    expect(pendingTests(weeks, new Set(["w1"]), "2026-11-01")).toEqual([
      w2,
      w3,
    ]);
  });
});
