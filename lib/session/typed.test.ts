import { describe, expect, it } from "vitest";

import { readTyped } from "./typed";

describe("readTyped", () => {
  it("passes letters through", () => {
    expect(readTyped("acc", "acco")).toEqual({ text: "acco", replay: false });
  });

  it("replays on a space in an empty box", () => {
    expect(readTyped("", " ")).toEqual({ text: "", replay: true });
  });

  it("drops a space mid-word without replaying", () => {
    expect(readTyped("acc", "acc ")).toEqual({ text: "acc", replay: false });
    expect(readTyped("acco", "ac co")).toEqual({ text: "acco", replay: false });
  });

  it("strips spaces from pasted text", () => {
    expect(readTyped("", " necessary\n")).toEqual({
      text: "necessary",
      replay: false,
    });
  });
});
