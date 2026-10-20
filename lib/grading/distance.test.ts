import { describe, expect, it } from "vitest";

import { distance } from "./distance";

describe("distance", () => {
  it("is 0 for identical words", () => {
    expect(distance("receive", "receive")).toBe(0);
  });

  it("counts against an empty string as the full length", () => {
    expect(distance("", "word")).toBe(4);
    expect(distance("word", "")).toBe(4);
  });

  it("counts one insertion, deletion or substitution as 1", () => {
    expect(distance("acomodate", "accomodate")).toBe(1);
    expect(distance("necesssary", "necessary")).toBe(1);
    expect(distance("seperate", "separate")).toBe(1);
  });

  it("counts swapped neighbors as one edit", () => {
    expect(distance("recieve", "receive")).toBe(1);
    expect(distance("ab", "ba")).toBe(1);
  });

  it("adds up several mistakes", () => {
    expect(distance("acommodate", "accommodate")).toBe(1);
    expect(distance("acomodate", "accommodate")).toBe(2);
    expect(distance("kitten", "sitting")).toBe(3);
  });

  it("is symmetric", () => {
    expect(distance("definately", "definitely")).toBe(
      distance("definitely", "definately"),
    );
  });

  it("treats an accented letter as a single letter", () => {
    expect(distance("cafe", "café")).toBe(1);
  });
});
