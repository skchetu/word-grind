import { describe, expect, it } from "vitest";

import { wordsNeedingSentence } from "./refresh";

const TZ = "America/Los_Angeles";
const word = (id: string, ...createdAt: string[]) => ({
  id,
  text: id,
  word_sentences: createdAt.map((created_at, i) => ({
    id: `${id}-${i}`,
    sentence: `A ${id} sentence.`,
    audio_path: null,
    created_at,
  })),
});

describe("wordsNeedingSentence", () => {
  it("picks words whose newest sentence is from an earlier day", () => {
    const words = [
      word("old", "2026-10-20T18:00:00Z", "2026-10-24T18:00:00Z"),
      word("fresh", "2026-10-20T18:00:00Z", "2026-10-26T18:00:00Z"),
    ];
    expect(
      wordsNeedingSentence(words, "2026-10-26", TZ).map((w) => w.id),
    ).toEqual(["old"]);
  });

  it("uses the household's time zone to decide the day", () => {
    // 03:00 UTC on Oct 27 is still Oct 26 in Los Angeles.
    const words = [word("late", "2026-10-27T03:00:00Z")];
    expect(wordsNeedingSentence(words, "2026-10-26", TZ)).toEqual([]);
    expect(wordsNeedingSentence(words, "2026-10-27", TZ)).toHaveLength(1);
  });

  it("picks a word with no sentences", () => {
    expect(wordsNeedingSentence([word("bare")], "2026-10-26", TZ)).toHaveLength(
      1,
    );
  });
});
