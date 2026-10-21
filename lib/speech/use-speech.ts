"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  createSpeaker,
  type SpeakOptions,
  type Speaker,
  type SpeakerState,
} from "./speaker";

// One speaker per page, since the browser has one speech queue.
let speaker: Speaker | null | undefined;
function getSpeaker() {
  if (speaker === undefined) {
    speaker =
      typeof window !== "undefined" && "speechSynthesis" in window
        ? createSpeaker(window.speechSynthesis)
        : null;
  }
  return speaker;
}

const SILENT: SpeakerState = { speaking: false, voices: [] };
const noop = () => () => {};
const subscribe = (listener: () => void) =>
  getSpeaker()?.subscribe(listener) ?? (() => {});
const getState = () => getSpeaker()?.getState() ?? SILENT;

// Text-to-speech for the drill. `supported` is false on the server and in
// browsers without speech, where the drill shows the definition instead.
export function useSpeech({
  voiceURI,
  rate,
}: { voiceURI?: string | null; rate?: number } = {}) {
  const supported = useSyncExternalStore(
    noop,
    () => getSpeaker() !== null,
    () => false,
  );
  const { speaking, voices } = useSyncExternalStore(
    subscribe,
    getState,
    () => SILENT,
  );
  const voice = voices.find((v) => v.voiceURI === voiceURI);

  const speak = useCallback(
    (parts: string[], onDone?: SpeakOptions["onDone"]) =>
      getSpeaker()?.speak(parts, { voice, rate, onDone }),
    [voice, rate],
  );
  const cancel = useCallback(() => getSpeaker()?.cancel(), []);

  // Leaving the screen stops the voice mid-sentence.
  useEffect(() => cancel, [cancel]);

  return { supported, speaking, voices, speak, cancel };
}
