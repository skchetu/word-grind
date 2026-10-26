import { describe, expect, it } from "vitest";

import { newestSentence, sentencesToPrune } from "./keep";

const saved = (id: string, createdAt: string) => ({ id, createdAt });
const ids = (sentences: { id: string }[]) => sentences.map((s) => s.id);

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

describe("sentencesToPrune", () => {
  it("keeps everything while a word has three or fewer", () => {
    const sentences = [
      saved("a", "2026-10-20T10:00:00Z"),
      saved("b", "2026-10-22T10:00:00Z"),
      saved("c", "2026-10-24T10:00:00Z"),
    ];
    expect(sentencesToPrune(sentences)).toEqual([]);
  });

  it("deletes all but the three newest", () => {
    const sentences = [
      saved("new", "2026-10-26T10:00:00Z"),
      saved("oldest", "2026-10-18T10:00:00Z"),
      saved("b", "2026-10-22T10:00:00Z"),
      saved("old", "2026-10-20T10:00:00Z"),
      saved("c", "2026-10-24T10:00:00Z"),
    ];
    expect(ids(sentencesToPrune(sentences))).toEqual(["oldest", "old"]);
  });

  it("keeps both sentences of a tie at the cut-off", () => {
    // A week's list saves its two sentences in the same moment.
    const sentences = [
      saved("list-1", "2026-10-20T10:00:00Z"),
      saved("list-2", "2026-10-20T10:00:00Z"),
      saved("b", "2026-10-22T10:00:00Z"),
      saved("c", "2026-10-24T10:00:00Z"),
    ];
    expect(sentencesToPrune(sentences)).toEqual([]);
  });
});
