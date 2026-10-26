import { describe, expect, it } from "vitest";
import { weeklyScores, type TestResult } from "./weekly";

const LA = "America/Los_Angeles";
const w1 = { id: "w1", startsOn: "2026-10-12" }; // test on Oct 18
const w2 = { id: "w2", startsOn: "2026-10-19" }; // test on Oct 25
const w3 = { id: "w3", startsOn: "2026-10-26" }; // test on Nov 1
const test = (
  profileId: string,
  weekId: string,
  finishedAt: string,
): TestResult => ({ profileId, weekId, score: 8, total: 10, finishedAt });

describe("weeklyScores", () => {
  it("lists weeks whose test has opened, newest first", () => {
    const rows = weeklyScores([w1, w3, w2], [], "2026-10-27", LA);
    expect(rows.map((r) => r.id)).toEqual(["w2", "w1"]);
  });

  it("marks a test finished after its Sunday as late", () => {
    const rows = weeklyScores(
      [w2],
      [
        // 11pm Sunday in Los Angeles is already Monday in UTC: on time.
        test("a", "w2", "2026-10-26T06:00:00Z"),
        test("b", "w2", "2026-10-27T18:00:00Z"),
      ],
      "2026-10-27",
      LA,
    );
    expect(rows[0]?.results).toEqual({
      a: { score: 8, total: 10, late: false },
      b: { score: 8, total: 10, late: true },
    });
  });

  it("leaves out people who haven't taken the test", () => {
    const rows = weeklyScores(
      [w1],
      [test("a", "w2", "2026-10-25T18:00:00Z")],
      "2026-10-27",
      LA,
    );
    expect(rows[0]?.results).toEqual({});
  });
});
