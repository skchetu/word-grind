import { describe, expect, it } from "vitest";

import { toDrillWords } from "./drill-words";

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
