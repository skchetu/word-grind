import { describe, expect, it } from "vitest";

import { buildTipRequest, buildWeekRequest } from "./prompts";

describe("buildWeekRequest", () => {
  it("asks for the list at the household's level", () => {
    expect(buildWeekRequest({ difficulty: 3, topics: [], avoid: [] })).toBe(
      "Write this week's list of exactly 10 words, aiming for difficulty 3.",
    );
  });

  it("adds last week's focus, topics and words to avoid", () => {
    const request = buildWeekRequest({
      difficulty: 4,
      topics: ["food"],
      avoid: ["rhythm"],
      focus: ["doubled consonants", "-ence vs -ance"],
    });
    expect(request.split("\n")).toEqual([
      "Write this week's list of exactly 10 words, aiming for difficulty 4.",
      "Include words that practise these patterns from last week's misses: doubled consonants; -ence vs -ance.",
      "Set the example sentences around: food.",
      "Don't use any of these recent words: rhythm.",
    ]);
  });
});

describe("buildTipRequest", () => {
  it("gives both spellings letter by letter, with the mistakes", () => {
    expect(
      buildTipRequest("vacuum", "vacuuum", [
        '"u" typed 3 times in a row where "vacuum" has it 2 times',
      ]),
    ).toBe(
      [
        "Correct spelling: vacuum (v-a-c-u-u-m)",
        "They typed: vacuuum (v-a-c-u-u-u-m)",
        'Mistakes: "u" typed 3 times in a row where "vacuum" has it 2 times',
      ].join("\n"),
    );
  });
});
