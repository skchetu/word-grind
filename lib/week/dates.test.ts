import { describe, expect, it } from "vitest";
import { todayIn, weekStart } from "./dates";

describe("todayIn", () => {
  it("uses the time zone's calendar date", () => {
    // 3am UTC on Tuesday is still Monday evening in Los Angeles.
    const now = new Date("2026-10-20T03:00:00Z");
    expect(todayIn("America/Los_Angeles", now)).toBe("2026-10-19");
    expect(todayIn("UTC", now)).toBe("2026-10-20");
  });
});

describe("weekStart", () => {
  it("returns the Monday on or before the date", () => {
    expect(weekStart("2026-10-19")).toBe("2026-10-19"); // Monday
    expect(weekStart("2026-10-21")).toBe("2026-10-19"); // Wednesday
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // Sunday
  });

  it("crosses month and year boundaries", () => {
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
    expect(weekStart("2027-01-01")).toBe("2026-12-28");
  });
});
