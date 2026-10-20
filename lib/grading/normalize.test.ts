import { describe, expect, it } from "vitest";

import { normalize } from "./normalize";

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  Ephemeral ")).toBe("ephemeral");
  });

  it("treats curly and straight apostrophes the same", () => {
    expect(normalize("don’t")).toBe("don't");
    expect(normalize("o‘clock")).toBe("o'clock");
    expect(normalize("donʼt")).toBe("don't");
  });

  it("composes accented letters so both encodings match", () => {
    const decomposed = "café"; // e + combining acute accent
    expect(normalize(decomposed)).toBe("café");
  });

  it("collapses runs of inner whitespace", () => {
    expect(normalize("ice \t cream")).toBe("ice cream");
  });
});
