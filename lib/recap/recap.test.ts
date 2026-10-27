import { describe, expect, it } from "vitest";

import { recapPlayers, recapSchema, type TestAnswer } from "./recap";

const members = [
  { id: "a", name: "Alex" },
  { id: "b", name: "Sam" },
];
const answer = (
  profileId: string,
  word: string,
  typed: string,
): TestAnswer => ({ profileId, word, typed, correct: word === typed });

describe("recapPlayers", () => {
  it("scores each member and lists their misspellings", () => {
    const answers = [
      answer("a", "rhythm", "rhythm"),
      answer("a", "accommodate", "acommodate"),
      answer("b", "rhythm", "rythm"),
      answer("b", "accommodate", "accommodate"),
    ];
    expect(recapPlayers(members, answers)).toEqual([
      {
        name: "Alex",
        score: 1,
        total: 2,
        misses: [{ word: "accommodate", typed: "acommodate" }],
      },
      {
        name: "Sam",
        score: 1,
        total: 2,
        misses: [{ word: "rhythm", typed: "rythm" }],
      },
    ]);
  });

  it("waits until every member has taken the test", () => {
    expect(recapPlayers(members, [answer("a", "rhythm", "rhythm")])).toBeNull();
  });

  it("is null for a household with no members", () => {
    expect(recapPlayers([], [])).toBeNull();
  });
});

describe("recapSchema", () => {
  it("trims the text and accepts up to three items per list", () => {
    const recap = recapSchema.parse({
      headline: " Sam wins by one! ",
      sharedPatterns: ["doubled consonants"],
      nextWeekFocus: ["-ence vs -ance", "silent letters"],
    });
    expect(recap.headline).toBe("Sam wins by one!");
  });

  it("rejects an empty headline or too many patterns", () => {
    expect(
      recapSchema.safeParse({
        headline: " ",
        sharedPatterns: [],
        nextWeekFocus: [],
      }).success,
    ).toBe(false);
    expect(
      recapSchema.safeParse({
        headline: "Tie!",
        sharedPatterns: ["a", "b", "c", "d"],
        nextWeekFocus: [],
      }).success,
    ).toBe(false);
  });
});
