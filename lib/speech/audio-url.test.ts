import { describe, expect, it } from "vitest";

import { audioUrl } from "./audio-url";

const base = "https://abc.supabase.co";

describe("audioUrl", () => {
  it("builds the public URL for a clip", () => {
    expect(audioUrl("words/123.mp3", base)).toBe(
      "https://abc.supabase.co/storage/v1/object/public/word-audio/words/123.mp3",
    );
  });

  it("copes with a trailing slash on the project URL", () => {
    expect(audioUrl("sentences/9.mp3", `${base}/`)).toBe(
      "https://abc.supabase.co/storage/v1/object/public/word-audio/sentences/9.mp3",
    );
  });

  it("returns undefined when there's no clip", () => {
    expect(audioUrl(null, base)).toBeUndefined();
    expect(audioUrl(undefined, base)).toBeUndefined();
    expect(audioUrl("", base)).toBeUndefined();
  });
});
