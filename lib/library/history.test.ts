import { describe, expect, it } from "vitest";
import { attemptHistory } from "./history";

const attempt = (createdAt: string, correct: boolean) => ({
  typed: correct ? "rhythm" : "rythm",
  correct,
  createdAt,
  kind: "drill" as const,
});

describe("attemptHistory", () => {
  it("lists the newest answer first", () => {
    const history = attemptHistory(
      [
        attempt("2026-10-20T18:00:00Z", false),
        attempt("2026-10-22T18:00:00Z", true),
      ],
      "America/Los_Angeles",
    );
    expect(history.map((h) => h.correct)).toEqual([true, false]);
  });

  it("dates each answer in the household's time zone", () => {
    // 3am UTC on the 21st is still the evening of the 20th in California.
    const [entry] = attemptHistory(
      [attempt("2026-10-21T03:00:00Z", true)],
      "America/Los_Angeles",
    );
    expect(entry?.day).toBe("2026-10-20");
  });
});
