import { describe, expect, it } from "vitest";

import type { Result } from "./machine";
import { shareText, squares, todaysDrillMarks } from "./share";

const result = (
  wordId: string,
  outcome: "right" | "close" | "missed",
): Result => ({
  wordId,
  answer: "typed",
  correct: outcome === "right",
  distance: outcome === "right" ? 0 : outcome === "close" ? 1 : 3,
  soClose: outcome === "close",
  hintUsed: false,
});

const outcomes = [
  "right",
  "right",
  "close",
  "right",
  "missed",
  "right",
  "right",
  "right",
  "missed",
  "right",
] as const;
const ten = outcomes.map((o, i) => result(`w${i}`, o));

describe("squares", () => {
  it("marks each word in the order asked, five to a row", () => {
    expect(squares(ten)).toEqual(["🟩🟩🟨🟩🟥", "🟩🟩🟩🟥🟩"]);
  });

  it("leaves a short last row", () => {
    expect(squares(ten.slice(0, 7))).toEqual(["🟩🟩🟨🟩🟥", "🟩🟩"]);
  });
});

describe("shareText", () => {
  it("titles a drill with its day and ends with the score", () => {
    expect(shareText("drill", "2026-10-27", ten)).toBe(
      [
        "Word Grind 🧍‍♀️📝🧍‍♂️",
        "Daily Drill (10.27.2026)",
        "",
        "🟩🟩🟨🟩🟥",
        "🟩🟩🟩🟥🟩",
        "",
        "7/10",
      ].join("\n"),
    );
  });

  it("titles a test with its week and leaves the words out", () => {
    const text = shareText("test", "2026-10-26", ten);
    expect(text.split("\n")[1]).toBe("Sunday Test (week of 10.26.2026)");
    expect(text).not.toContain("w0");
    expect(text).not.toContain("typed");
  });
});

describe("todaysDrillMarks", () => {
  const tz = "America/Los_Angeles";
  const attempts = [
    { correct: true, editDistance: 0 },
    { correct: false, editDistance: 1 },
    { correct: false, editDistance: 3 },
  ];

  it("marks a drill finished today, with one letter off as so close", () => {
    // 8 pm on Oct 29 in Los Angeles is already Oct 30 in UTC.
    const drill = { finishedAt: "2026-10-30T03:00:00Z", attempts };
    expect(todaysDrillMarks(drill, "2026-10-29", tz)).toEqual([
      { correct: true, soClose: false },
      { correct: false, soClose: true },
      { correct: false, soClose: false },
    ]);
  });

  it("is null for a drill from an earlier day", () => {
    const drill = { finishedAt: "2026-10-29T03:00:00Z", attempts };
    expect(todaysDrillMarks(drill, "2026-10-29", tz)).toBeNull();
  });

  it("is null with no drill or no answers", () => {
    expect(todaysDrillMarks(null, "2026-10-29", tz)).toBeNull();
    const empty = { finishedAt: "2026-10-29T18:00:00Z", attempts: [] };
    expect(todaysDrillMarks(empty, "2026-10-29", tz)).toBeNull();
  });
});
