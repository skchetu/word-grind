import { describe, expect, it } from "vitest";
import {
  checkWeek,
  toCloze,
  weekSchema,
  wordCardSchema,
  type WordCardOutput,
  type WeekOutput,
} from "./schemas";

function card(overrides: Partial<WordCardOutput> = {}): WordCardOutput {
  return {
    word: "ephemeral",
    partOfSpeech: "adjective",
    definition: "lasting a very short time",
    ipa: "/ɪˈfɛm(ə)rəl/",
    syllables: ["e", "phem", "er", "al"],
    origin: "Greek ephēmeros, lasting only a day",
    mnemonic: "one f sound, spelled ph",
    difficulty: 3,
    sentences: [
      "Fame on the internet is ephemeral.",
      "Ephemeral snow melted by noon.",
    ],
    ...overrides,
  };
}

// A valid week of n distinct words built from made-up letter strings.
function week(n = 12): WeekOutput {
  const words = Array.from({ length: n }, (_, i) => {
    const word = `word${"abcdefghijklmnop"[i]}`;
    return card({
      word,
      syllables: [word],
      sentences: [`This uses ${word}.`, `So does ${word} here.`],
    });
  });
  return { theme: "Test week", words };
}

describe("wordCardSchema", () => {
  it("accepts a complete card", () => {
    expect(wordCardSchema.safeParse(card()).success).toBe(true);
  });

  it("rejects capitals, spaces and a difficulty out of range", () => {
    for (const bad of [
      card({ word: "Ephemeral" }),
      card({ word: "ad hoc" }),
      card({ difficulty: 6 }),
    ]) {
      expect(wordCardSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("needs exactly two sentences", () => {
    const one = card({ sentences: ["Fame is ephemeral."] });
    expect(wordCardSchema.safeParse(one).success).toBe(false);
  });
});

describe("weekSchema", () => {
  it("accepts 12 to 15 words", () => {
    expect(weekSchema.safeParse(week(12)).success).toBe(true);
    expect(weekSchema.safeParse(week(15)).success).toBe(true);
  });

  it("rejects too few or too many words", () => {
    expect(weekSchema.safeParse(week(11)).success).toBe(false);
    expect(weekSchema.safeParse(week(16)).success).toBe(false);
  });
});

describe("toCloze", () => {
  it("blanks every use of the word, in any case", () => {
    expect(toCloze("Ephemeral joy is still ephemeral.", "ephemeral")).toBe(
      "______ joy is still ______.",
    );
  });

  it("returns null when only a longer form appears", () => {
    expect(toCloze("It faded ephemerally.", "ephemeral")).toBeNull();
  });
});

describe("checkWeek", () => {
  it("finds nothing wrong with a good week", () => {
    expect(checkWeek(week())).toEqual([]);
  });

  it("reports repeats, bad syllables and sentences missing the word", () => {
    const w = week();
    const first = w.words[0]!;
    w.words[1] = { ...first };
    w.words[2] = card({ syllables: ["e", "fem", "er", "al"] });
    w.words[3] = card({
      word: "laconic",
      syllables: ["la", "con", "ic"],
      sentences: ["He was laconic.", "She said little."],
    });

    expect(checkWeek(w)).toEqual([
      `"${first.word}" appears twice`,
      `"ephemeral" syllables don't spell the word`,
      `"laconic" sentence 2 doesn't use the word`,
    ]);
  });
});
