import { describe, expect, it } from "vitest";

import { align } from "./align";
import { type Tile, toRows } from "./tiles";

// Writes a row as text: plain letters as is, marked ones as [kind:letter].
const show = (tiles: Tile[]) =>
  tiles
    .map((t) => (t.kind === "ok" ? t.letter : `[${t.kind}:${t.letter}]`))
    .join("");
const rows = (answer: string, word: string) => {
  const { typed, correct } = toRows(align(answer, word));
  return { typed: show(typed), correct: show(correct) };
};

describe("toRows", () => {
  it("shows the same plain word twice for a correct answer", () => {
    expect(rows("rhythm", "rhythm")).toEqual({
      typed: "rhythm",
      correct: "rhythm",
    });
  });

  it("puts a wrong letter above its fix", () => {
    expect(rows("seperate", "separate")).toEqual({
      typed: "sep[wrong:e]rate",
      correct: "sep[fix:a]rate",
    });
  });

  it("leaves a gap above each missing letter", () => {
    expect(rows("acomodate", "accommodate")).toEqual({
      typed: "a[gap:]co[gap:]modate",
      correct: "a[fix:c]co[fix:m]modate",
    });
  });

  it("leaves extra letters out of the correct row", () => {
    expect(rows("pharaoahs", "pharaoh")).toEqual({
      typed: "pharao[extra:a]h[extra:s]",
      correct: "pharaoh",
    });
  });

  it("marks both swapped letters, then both fixes", () => {
    expect(rows("recieve", "receive")).toEqual({
      typed: "rec[swapped:i][swapped:e]ve",
      correct: "rec[fix:e][fix:i]ve",
    });
  });
});
