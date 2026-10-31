import { describe, expect, it } from "vitest";

import { wordsNeedingSentence } from "./refresh";

const word = (id: string, count: number) => ({
  id,
  text: id,
  word_sentences: Array.from({ length: count }, (_, i) => ({
    id: `${id}-${i}`,
    sentence: `A ${id} sentence.`,
    audio_path: null,
    created_at: "2026-10-20T18:00:00Z",
  })),
});

describe("wordsNeedingSentence", () => {
  it("picks words with fewer than three sentences", () => {
    const words = [word("bare", 0), word("two", 2), word("full", 3)];
    expect(wordsNeedingSentence(words).map((w) => w.id)).toEqual([
      "bare",
      "two",
    ]);
  });
});
