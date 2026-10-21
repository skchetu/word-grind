export const DEFAULT_RATE = 0.9;
// The gap between the word and its sentence, like a spelling bee caller.
export const PAUSE_MS = 700;

export type SpeakerState = {
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
};

export type SpeakOptions = {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  onDone?: () => void;
};

// English voices only. Android reports tags like "en_US", others "en-US".
export function englishVoices(voices: SpeechSynthesisVoice[]) {
  return voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
}

// Wraps `speechSynthesis` as a small store that React can subscribe to.
// Kept free of React so it can be tested with a mocked synth.
export function createSpeaker(synth: SpeechSynthesis) {
  let state: SpeakerState = {
    speaking: false,
    voices: englishVoices(synth.getVoices()),
  };
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // The utterance being read. Holding it also stops Chrome garbage-collecting
  // it mid-speech and skipping `onend`.
  let current: SpeechSynthesisUtterance | null = null;

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
    synth.cancel();
    if (state.speaking) update({ speaking: false });
  }

  // Reads each part in turn with a pause between, then calls `onDone`.
  // A new call or `cancel()` stops the old one without calling its `onDone`.
  function speak(parts: string[], options: SpeakOptions = {}) {
    cancel();
    update({ speaking: true });

    const say = (i: number) => {
      const text = parts[i];
      if (text === undefined) {
        current = null;
        update({ speaking: false });
        options.onDone?.();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? DEFAULT_RATE;
      if (options.voice) {
        utterance.voice = options.voice;
        utterance.lang = options.voice.lang;
      }
      // An error (say, autoplay blocked) moves on rather than hanging.
      utterance.onend = utterance.onerror = () => {
        if (current !== utterance) return; // cancelled or replaced
        timer = setTimeout(
          () => say(i + 1),
          i + 1 < parts.length ? PAUSE_MS : 0,
        );
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
