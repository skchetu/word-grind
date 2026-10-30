import { describe, expect, it } from "vitest";

import { readTyped } from "./typed";

describe("readTyped", () => {
  it("passes letters through", () => {
    expect(readTyped("acc", "acco")).toEqual({
      text: "acco",
      replay: false,
      blocked: false,
    });
  });

  it("replays on a space in an empty box", () => {
    expect(readTyped("", " ")).toEqual({
      text: "",
      replay: true,
      blocked: false,
    });
  });

  it("drops a space mid-word without replaying", () => {
    expect(readTyped("acc", "acc ").text).toBe("acc");
    expect(readTyped("acco", "ac co").text).toBe("acco");
  });

  it("allows a letter typed mid-word, a replaced letter and deletions", () => {
    expect(readTyped("acomodate", "accomodate").blocked).toBe(false);
    expect(readTyped("recieve", "receeve").blocked).toBe(false);
    expect(readTyped("necessary", "nary").blocked).toBe(false);
    expect(readTyped("rhythm", "").blocked).toBe(false);
  });

  it("blocks a suggestion, autocorrect or paste that adds several letters", () => {
    expect(readTyped("acc", "accommodate ")).toEqual({
      text: "acc",
      replay: false,
      blocked: true,
    });
    expect(readTyped("recieve", "receive").blocked).toBe(true);
    expect(readTyped("", "necessary").blocked).toBe(true);
  });
});
