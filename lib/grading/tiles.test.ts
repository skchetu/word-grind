import { describe, expect, it } from "vitest";

import { align } from "./align";
import { toTiles } from "./tiles";

const tiles = (answer: string, word: string) => toTiles(align(answer, word));
const kinds = (answer: string, word: string) =>
  tiles(answer, word)
    .map((t) => (t.kind === "ok" ? t.letter : `[${t.kind}:${t.letter}]`))
    .join("");

describe("toTiles", () => {
  it("marks every letter ok for a correct answer", () => {
    expect(kinds("rhythm", "rhythm")).toBe("rhythm");
  });

  it("marks missing letters", () => {
    expect(kinds("acomodate", "accommodate")).toBe(
      "a[missing:c]co[missing:m]modate",
    );
  });

  it("marks extra letters", () => {
    expect(kinds("untill", "until")).toBe("unti[extra:l]l");
  });

  it("marks a wrong letter and keeps what was typed", () => {
    expect(tiles("seperate", "separate")[3]).toEqual({
      kind: "wrong",
      letter: "a",
      typed: "e",
    });
  });

  it("marks both letters of a swap", () => {
    expect(kinds("recieve", "receive")).toBe("rec[swapped:e][swapped:i]ve");
  });
});
