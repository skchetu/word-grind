import { describe, expect, it, vi } from "vitest";

import { clipJobs, makeClips, type ClipJob } from "./clips";

const W = "11111111-1111-4111-8111-111111111111";
const S1 = "22222222-2222-4222-8222-222222222222";
const S2 = "33333333-3333-4333-8333-333333333333";

describe("clipJobs", () => {
  it("lists the word and sentences that have no clip yet", () => {
    const rows = [
      {
        word: {
          id: W,
          text: "laconic",
          audio_path: null,
          word_sentences: [
            { id: S1, sentence: "A laconic reply.", audio_path: null },
            {
              id: S2,
              sentence: "He was laconic.",
              audio_path: `sentences/${S2}.mp3`,
            },
          ],
        },
      },
    ];
    expect(clipJobs(rows)).toEqual([
      { table: "words", id: W, text: "laconic", path: `words/${W}.mp3` },
      {
        table: "word_sentences",
        id: S1,
        text: "A laconic reply.",
        path: `sentences/${S1}.mp3`,
      },
    ]);
  });

  it("skips a word that already has its clip", () => {
    const rows = [
      {
        word: {
          id: W,
          text: "laconic",
          audio_path: `words/${W}.mp3`,
          word_sentences: [],
        },
      },
    ];
    expect(clipJobs(rows)).toEqual([]);
  });
});

const job = (id: string): ClipJob => ({
  table: "words",
  id,
  text: id,
  path: `words/${id}.mp3`,
});

describe("makeClips", () => {
  it("records, stores and links each clip", async () => {
    const mp3 = new ArrayBuffer(3);
    const steps = {
      record: vi.fn(async () => mp3),
      store: vi.fn(async () => {}),
      link: vi.fn(async () => {}),
    };
    const result = await makeClips([job("a"), job("b"), job("c")], steps);

    expect(result).toEqual({ made: 3, failed: 0 });
    expect(steps.store).toHaveBeenCalledWith("words/a.mp3", mp3);
    expect(steps.link).toHaveBeenCalledTimes(3);
  });

  it("skips a failed clip and keeps going", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const steps = {
      record: vi.fn(async (text: string) => {
        if (text === "b") throw new Error("ElevenLabs 429");
        return new ArrayBuffer(1);
      }),
      store: vi.fn(async () => {}),
      link: vi.fn(async () => {}),
    };
    const result = await makeClips([job("a"), job("b"), job("c")], steps);

    expect(result).toEqual({ made: 2, failed: 1 });
    expect(steps.link).not.toHaveBeenCalledWith(job("b"));
  });

  it("never runs more than the given number at once", async () => {
    let running = 0;
    let peak = 0;
    const steps = {
      async record() {
        running++;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
        return new ArrayBuffer(1);
      },
      store: async () => {},
      link: async () => {},
    };
    await makeClips(["a", "b", "c", "d", "e"].map(job), steps, 2);

    expect(peak).toBe(2);
  });
});
