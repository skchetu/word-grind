import { describe, expect, it } from "vitest";

import { newestSentence, sentenceForTurn } from "./keep";

const saved = (id: string, createdAt: string) => ({ id, createdAt });

describe("newestSentence", () => {
  it("picks the most recently saved sentence", () => {
    const sentences = [
      saved("a", "2026-10-20T10:00:00Z"),
      saved("c", "2026-10-26T09:00:00Z"),
      saved("b", "2026-10-22T10:00:00Z"),
    ];
    expect(newestSentence(sentences)?.id).toBe("c");
  });

  it("returns undefined for a word without sentences", () => {
    expect(newestSentence([])).toBeUndefined();
  });
});

describe("sentenceForTurn", () => {
  const sentences = [
    saved("b", "2026-10-26T09:00:00Z"),
    saved("a", "2026-10-20T10:00:00Z"),
    saved("c", "2026-10-28T09:00:00Z"),
  ];

  it("moves on one sentence each turn, oldest first, then wraps", () => {
    const shown = [0, 1, 2, 3].map((t) => sentenceForTurn(sentences, t)?.id);
    expect(shown).toEqual(["a", "b", "c", "a"]);
  });

  it("returns undefined for a word without sentences", () => {
    expect(sentenceForTurn([], 0)).toBeUndefined();
  });
});
