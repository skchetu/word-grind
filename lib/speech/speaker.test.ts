import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSpeaker, englishVoices, PAUSE_MS } from "./speaker";

// Node has no speech, so stand in a minimal utterance and synth.
class FakeUtterance {
  rate = 1;
  lang = "";
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

const voice = (lang: string, voiceURI = lang) =>
  ({ lang, voiceURI, name: voiceURI }) as SpeechSynthesisVoice;

function fakeSynth(initialVoices: SpeechSynthesisVoice[] = []) {
  let voices = initialVoices;
  let onVoices = () => {};
  const spoken: FakeUtterance[] = [];
  const synth = {
    getVoices: () => voices,
    addEventListener: (_: string, fn: () => void) => (onVoices = fn),
    speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
    cancel: vi.fn(),
  };
  return {
    synth: synth as unknown as SpeechSynthesis,
    spoken,
    // Finishes the latest utterance, as the browser would.
    finish: () => spoken.at(-1)?.onend?.(),
    loadVoices(next: SpeechSynthesisVoice[]) {
      voices = next;
      onVoices();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("englishVoices", () => {
  it("keeps en-* and en_* voices only", () => {
    const voices = [
      voice("en-US"),
      voice("en_GB"),
      voice("ko-KR"),
      voice("eng"),
    ];
    expect(englishVoices(voices).map((v) => v.lang)).toEqual([
      "en-US",
      "en_GB",
    ]);
  });
});

describe("createSpeaker", () => {
  it("says the word, pauses, then reads the sentence", () => {
    const fake = fakeSynth();
    const speaker = createSpeaker(fake.synth);
    const onDone = vi.fn();

    speaker.speak(["laconic", "Her laconic reply ended it."], { onDone });
    expect(speaker.getState().speaking).toBe(true);
    expect(fake.spoken.map((u) => u.text)).toEqual(["laconic"]);
    expect(fake.spoken[0]?.rate).toBe(0.9);

    fake.finish();
    vi.advanceTimersByTime(PAUSE_MS - 1);
    expect(fake.spoken).toHaveLength(1); // still pausing
    vi.advanceTimersByTime(1);
    expect(fake.spoken[1]?.text).toBe("Her laconic reply ended it.");

    fake.finish();
    vi.runAllTimers();
    expect(onDone).toHaveBeenCalledOnce();
    expect(speaker.getState().speaking).toBe(false);
  });

  it("reports the first part as done while the sentence still plays", () => {
    const fake = fakeSynth();
    const onFirstDone = vi.fn();
    const onDone = vi.fn();

    createSpeaker(fake.synth).speak(["laconic", "Her laconic reply."], {
      onFirstDone,
      onDone,
    });
    expect(onFirstDone).not.toHaveBeenCalled();

    fake.finish();
    expect(onFirstDone).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(PAUSE_MS);
    expect(fake.spoken[1]?.text).toBe("Her laconic reply.");
    expect(onDone).not.toHaveBeenCalled();

    fake.finish();
    vi.runAllTimers();
    expect(onFirstDone).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("uses the chosen voice and rate", () => {
    const fake = fakeSynth();
    const gb = voice("en-GB");
    createSpeaker(fake.synth).speak(["ephemeral"], { voice: gb, rate: 0.7 });
    expect(fake.spoken[0]).toMatchObject({
      voice: gb,
      lang: "en-GB",
      rate: 0.7,
    });
  });

  it("cancel stops the queue without calling onDone", () => {
    const fake = fakeSynth();
    const speaker = createSpeaker(fake.synth);
    const onDone = vi.fn();
    const listener = vi.fn();
    speaker.subscribe(listener);

    speaker.speak(["garrulous", "A garrulous host."], { onDone });
    fake.finish();
    speaker.cancel();
    vi.runAllTimers();
    fake.spoken[0]?.onerror?.(); // browsers fire "interrupted" on cancel

    expect(fake.synth.cancel).toHaveBeenCalled();
    expect(fake.spoken).toHaveLength(1);
    expect(onDone).not.toHaveBeenCalled();
    expect(speaker.getState().speaking).toBe(false);
    expect(listener).toHaveBeenCalled();
  });

  it("moves on when an utterance errors", () => {
    const fake = fakeSynth();
    const onDone = vi.fn();
    createSpeaker(fake.synth).speak(["pernicious"], { onDone });
    fake.spoken[0]?.onerror?.();
    vi.runAllTimers();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("picks up voices that load late", () => {
    const fake = fakeSynth([]);
    const speaker = createSpeaker(fake.synth);
    expect(speaker.getState().voices).toEqual([]);
    fake.loadVoices([voice("en-US"), voice("hi-IN")]);
    expect(speaker.getState().voices.map((v) => v.lang)).toEqual(["en-US"]);
  });
});

// Records each clip it's asked to play; the test decides how it ends.
function fakePlayer() {
  const clips: { url: string; done: (played: boolean) => void }[] = [];
  const stop = vi.fn();
  const player = vi.fn((url: string, done: (played: boolean) => void) => {
    clips.push({ url, done });
    return stop;
  });
  return { player, clips, stop };
}

describe("createSpeaker with recorded clips", () => {
  it("plays the clip instead of the browser voice, then moves on", () => {
    const fake = fakeSynth();
    const clips = fakePlayer();
    const onDone = vi.fn();
    createSpeaker(fake.synth, clips.player).speak(
      [{ text: "laconic", audioUrl: "/w.mp3" }, "A laconic reply."],
      { onDone },
    );
    expect(clips.clips.map((c) => c.url)).toEqual(["/w.mp3"]);
    expect(fake.spoken).toHaveLength(0);

    clips.clips[0]?.done(true);
    vi.advanceTimersByTime(PAUSE_MS);
    expect(fake.spoken.map((u) => u.text)).toEqual(["A laconic reply."]);
    fake.finish();
    vi.runAllTimers();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("falls back to the browser voice when a clip fails", () => {
    const fake = fakeSynth();
    const clips = fakePlayer();
    createSpeaker(fake.synth, clips.player).speak([
      { text: "laconic", audioUrl: "/w.mp3" },
    ]);
    clips.clips[0]?.done(false);
    clips.clips[0]?.done(false); // a second error event is ignored
    expect(fake.spoken.map((u) => u.text)).toEqual(["laconic"]);
  });

  it("stops the clip on cancel and ignores its late end", () => {
    const fake = fakeSynth();
    const clips = fakePlayer();
    const onDone = vi.fn();
    const speaker = createSpeaker(fake.synth, clips.player);
    speaker.speak([{ text: "laconic", audioUrl: "/w.mp3" }], { onDone });

    speaker.cancel();
    clips.clips[0]?.done(true);
    vi.runAllTimers();
    expect(clips.stop).toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});
