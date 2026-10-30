import { describe, expect, it } from "vitest";

import { align } from "./align";
import { type Tile, toColumns } from "./tiles";

// Writes a row as text: plain letters as is, marked ones as [kind:letter]
// and an empty cell as _.
const show = (tile: Tile | null) =>
  !tile
    ? "_"
    : tile.kind === "ok"
      ? tile.letter
      : `[${tile.kind}:${tile.letter}]`;
const rows = (answer: string, word: string) => {
  const columns = toColumns(align(answer, word));
  return {
    typed: columns.map((c) => show(c.typed)).join(""),
    correct: columns.map((c) => show(c.correct)).join(""),
  };
};

describe("toColumns", () => {
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

  it("leaves the correct row empty under an extra letter", () => {
    expect(rows("pharaohh", "pharaoh")).toEqual({
      typed: "pharao[extra:h]h",
      correct: "pharao_h",
    });
  });

  it("marks both swapped letters, then both fixes", () => {
    expect(rows("recieve", "receive")).toEqual({
      typed: "rec[swapped:i][swapped:e]ve",
      correct: "rec[fix:e][fix:i]ve",
    });
  });
});
