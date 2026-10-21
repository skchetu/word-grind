import { describe, expect, it } from "vitest";
import { fallbackWeek } from "@/lib/ai/generate-week";
import { toSavePayload } from "./save";

describe("toSavePayload", () => {
  it("pairs each sentence with its fill-in-the-blank version", () => {
    const week = fallbackWeek(0);
    const payload = toSavePayload(week);
    const first = payload.words[0]!;

    expect(payload.theme).toBe(week.theme);
    expect(payload.words).toHaveLength(week.words.length);
    expect(first.sentences[0]).toEqual({
      sentence: week.words[0]!.sentences[0],
      cloze: expect.stringContaining("______"),
    });
    expect(first.sentences[0]!.cloze).not.toMatch(new RegExp(first.word, "i"));
  });
});
