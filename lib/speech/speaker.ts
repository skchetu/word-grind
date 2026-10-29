export const DEFAULT_RATE = 0.9;
// The gap between the word and its sentence, like a spelling bee caller.
export const PAUSE_MS = 700;

export type SpeakerState = {
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
};

// A piece of text to read. With `audioUrl`, a recorded clip plays instead,
// and the browser voice reads `text` only if the clip fails.
export type SpeechPart = string | { text: string; audioUrl?: string };

// Plays a clip and calls `done(true)` when it ends or `done(false)` if it
// can't play. Returns a function that stops it.
export type AudioPlayer = (
  url: string,
  done: (played: boolean) => void,
) => () => void;

export type SpeakOptions = {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  // Called as soon as the first part has been read, while the rest goes on.
  onFirstDone?: () => void;
  onDone?: () => void;
};

// English voices only. Android reports tags like "en_US", others "en-US".
export function englishVoices(voices: SpeechSynthesisVoice[]) {
  return voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
}

// Wraps `speechSynthesis` (and recorded clips, when there's a player) as a
// small store that React can subscribe to. Kept free of React so it can be
// tested with a mocked synth.
export function createSpeaker(synth: SpeechSynthesis, player?: AudioPlayer) {
  let state: SpeakerState = {
    speaking: false,
    voices: englishVoices(synth.getVoices()),
  };
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // The utterance or clip being played. Holding the utterance also stops
  // Chrome garbage-collecting it mid-speech and skipping `onend`.
  let current: object | null = null;
  let stopClip: (() => void) | undefined;

  function update(next: Partial<SpeakerState>) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }

  // Chrome loads voices asynchronously, so the first list can be empty.
  synth.addEventListener("voiceschanged", () =>
    update({ voices: englishVoices(synth.getVoices()) }),
  );

  function cancel() {
    clearTimeout(timer);
    current = null;
    stopClip?.();
    stopClip = undefined;
    synth.cancel();
    if (state.speaking) update({ speaking: false });
  }

  // Reads each part in turn with a pause between, then calls `onDone`.
  // A new call or `cancel()` stops the old one without calling its `onDone`.
  function speak(parts: SpeechPart[], options: SpeakOptions = {}) {
    cancel();
    update({ speaking: true });

    const next = (i: number) => {
      if (i === 0) options.onFirstDone?.();
      timer = setTimeout(() => say(i + 1), i + 1 < parts.length ? PAUSE_MS : 0);
    };

    const say = (i: number) => {
      const part = parts[i];
      if (part === undefined) {
        current = null;
        update({ speaking: false });
        options.onDone?.();
        return;
      }
      const { text, audioUrl } =
        typeof part === "string" ? { text: part, audioUrl: undefined } : part;
      if (!audioUrl || !player) return read(i, text);

      const clip = {};
      let settled = false;
      current = clip;
      stopClip = player(audioUrl, (played) => {
        if (settled || current !== clip) return; // already done or cancelled
        settled = true;
        stopClip = undefined;
        if (played) next(i);
        else read(i, text);
      });
    };

    const read = (i: number, text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? DEFAULT_RATE;
      if (options.voice) {
        utterance.voice = options.voice;
        utterance.lang = options.voice.lang;
      }
      // An error (say, autoplay blocked) moves on rather than hanging.
      utterance.onend = utterance.onerror = () => {
        if (current !== utterance) return; // cancelled or replaced
        next(i);
      };
      current = utterance;
      synth.speak(utterance);
    };
    say(0);
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    speak,
    cancel,
  };
}

export type Speaker = ReturnType<typeof createSpeaker>;
