import { describe, expect, it } from "vitest";

import { toDrillWords, toReviews } from "./drill-words";

const row = (position: number, text: string, audio_path: string | null) => ({
  position,
  words: { id: `id-${text}`, text, definition: `${text} means…`, audio_path },
});

describe("toDrillWords", () => {
  it("orders by position and adds clip URLs where they exist", () => {
    const words = toDrillWords(
      [row(2, "laconic", null), row(1, "ephemeral", "words/id-ephemeral.mp3")],
      "https://abc.supabase.co",
    );
    expect(words).toEqual([
      {
        id: "id-ephemeral",
        text: "ephemeral",
        definition: "ephemeral means…",
        audioUrl:
          "https://abc.supabase.co/storage/v1/object/public/word-audio/words/id-ephemeral.mp3",
      },
      {
        id: "id-laconic",
        text: "laconic",
        definition: "laconic means…",
        audioUrl: undefined,
      },
    ]);
  });
});

describe("toReviews", () => {
  const review = (id: string, due_on: string) => ({
    word_id: id,
    due_on,
    words: { id, text: id, definition: "", audio_path: null },
  });

  it("lists every reviewed word and the ones due by today", () => {
    const { reviewed, due } = toReviews(
      [
        review("a", "2026-10-22"),
        review("b", "2026-10-23"),
        review("c", "2026-10-24"),
      ],
      "2026-10-23",
      "https://abc.supabase.co",
    );
    expect([...reviewed]).toEqual(["a", "b", "c"]);
    expect(due.map((d) => [d.word.id, d.dueOn])).toEqual([
      ["a", "2026-10-22"],
      ["b", "2026-10-23"],
    ]);
  });
});
