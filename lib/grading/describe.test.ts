import { describe, expect, it } from "vitest";

import { align } from "./align";
import { describeMistakes } from "./describe";

const mistakes = (answer: string, word: string) =>
  describeMistakes(align(answer, word));

describe("describeMistakes", () => {
  it("counts a letter typed too many times in a row", () => {
    expect(mistakes("vacuuum", "vacuum")).toEqual([
      '"u" typed 3 times in a row where "vacuum" has it 2 times',
    ]);
  });

  it("counts a doubled letter typed once", () => {
    expect(mistakes("acommodate", "accommodate")).toEqual([
      '"c" typed 1 time in a row where "accommodate" has it 2 times',
    ]);
  });

  it("names a missing letter and where it is", () => {
    expect(mistakes("enviroment", "environment")).toEqual([
      'a missing "n" after "enviro"',
    ]);
  });

  it("names an extra letter and where it is", () => {
    expect(mistakes("truely", "truly")).toEqual(['an extra "e" after "tru"']);
  });

  it("names a wrong letter", () => {
    expect(mistakes("seperate", "separate")).toEqual([
      '"e" instead of "a" after "sep"',
    ]);
  });

  it("names swapped letters", () => {
    expect(mistakes("recieve", "receive")).toEqual([
      '"ie" swapped, it should be "ei", after "rec"',
    ]);
  });

  it("says when the mistake is at the start", () => {
    expect(mistakes("pneumonia", "neumonia")).toEqual([
      'an extra "p" at the start',
    ]);
  });

  it("lists each mistake in order", () => {
    expect(mistakes("acomodate", "accommodate")).toHaveLength(2);
  });
});
