import { describe, expect, it } from "vitest";

import { grade } from "./grade";

describe("grade", () => {
  it("marks an exact match correct", () => {
    expect(grade("rhythm", "rhythm")).toEqual({
      correct: true,
      distance: 0,
      soClose: false,
    });
  });

  it("ignores case, spacing and apostrophe style", () => {
    expect(grade("  Don’t ", "don't").correct).toBe(true);
  });

  it("flags one-edit misses as so close, but still wrong", () => {
    expect(grade("rythm", "rhythm")).toEqual({
      correct: false,
      distance: 1,
      soClose: true,
    });
  });

  it("does not flag bigger misses as so close", () => {
    const result = grade("rithm", "rhythm");
    expect(result.correct).toBe(false);
    expect(result.soClose).toBe(false);
  });
});
