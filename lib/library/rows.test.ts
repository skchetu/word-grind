import { describe, expect, it } from "vitest";
import { libraryRows } from "./rows";

const review = (wordId: string, text: string) => ({
  wordId,
  text,
  box: 2,
  dueOn: "2026-10-28",
});
const reviews = [
  review("1", "rhythm"),
  review("2", "liaison"),
  review("3", "Ballet"),
];

describe("libraryRows", () => {
  it("sorts words alphabetically and counts misses", () => {
    const rows = libraryRows(reviews, ["1", "1", "2"]);
    expect(rows.map((r) => [r.text, r.misses])).toEqual([
      ["Ballet", 0],
      ["liaison", 1],
      ["rhythm", 2],
    ]);
  });

  it("keeps words containing the search, ignoring case and spaces", () => {
    expect(libraryRows(reviews, [], " LL ").map((r) => r.text)).toEqual([
      "Ballet",
    ]);
  });

  it("returns nothing when no word matches", () => {
    expect(libraryRows(reviews, [], "zz")).toEqual([]);
  });
});
