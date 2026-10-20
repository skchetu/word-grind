import { describe, expect, it } from "vitest";

import { align, type AlignStep } from "./align";
import { distance } from "./distance";
import { normalize } from "./normalize";

const edits = (steps: AlignStep[]) =>
  steps.filter((step) => step.op !== "keep").length;

describe("align", () => {
  it("keeps every letter of a correct answer", () => {
    expect(align("cat", "cat")).toEqual([
      { op: "keep", letter: "c" },
      { op: "keep", letter: "a" },
      { op: "keep", letter: "t" },
    ]);
  });

  it("marks a wrong letter as a substitution", () => {
    expect(align("seperate", "separate")[3]).toEqual({
      op: "substitute",
      typed: "e",
      expected: "a",
    });
  });

  it("marks a missing letter as an insertion", () => {
    const steps = align("rythm", "rhythm");
    expect(steps.filter((step) => step.op === "insert")).toEqual([
      { op: "insert", expected: "h" },
    ]);
    expect(edits(steps)).toBe(1);
  });

  it("marks an extra letter as a deletion", () => {
    const steps = align("untill", "until");
    expect(steps.filter((step) => step.op === "delete")).toEqual([
      { op: "delete", typed: "l" },
    ]);
    expect(edits(steps)).toBe(1);
  });

  it("marks reversed neighbors as one swap", () => {
    expect(align("recieve", "receive")).toEqual([
      { op: "keep", letter: "r" },
      { op: "keep", letter: "e" },
      { op: "keep", letter: "c" },
      { op: "swap", typed: "ie", expected: "ei" },
      { op: "keep", letter: "v" },
      { op: "keep", letter: "e" },
    ]);
  });

  it("handles an empty answer", () => {
    expect(align("", "ox")).toEqual([
      { op: "insert", expected: "o" },
      { op: "insert", expected: "x" },
    ]);
  });

  it("grades the normalized answer, like grade does", () => {
    expect(edits(align(" Don’t", "don't"))).toBe(0);
  });

  it("always uses exactly as many edits as the distance", () => {
    const pairs = [
      ["acomodate", "accommodate"],
      ["definately", "definitely"],
      ["kitten", "sitting"],
      ["mispell", "misspell"],
      ["concsience", "conscience"],
      ["", "word"],
      ["word", ""],
    ] as const;
    for (const [answer, word] of pairs) {
      expect(edits(align(answer, word))).toBe(
        distance(normalize(answer), normalize(word)),
      );
    }
  });

  it("rebuilds the correct word from the steps", () => {
    const steps = align("acomodate", "accommodate");
    const rebuilt = steps
      .map((step) =>
        step.op === "keep"
          ? step.letter
          : step.op === "delete"
            ? ""
            : step.expected,
      )
      .join("");
    expect(rebuilt).toBe("accommodate");
  });
});
