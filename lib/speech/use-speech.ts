"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  createSpeaker,
  type AudioPlayer,
  type SpeakOptions,
  type Speaker,
  type SpeakerState,
  type SpeechPart,
} from "./speaker";

// One audio element, reused for every clip. iOS only lets an element play
// sound after a tap has started it, so reusing it means one unlock covers
// every later clip.
let audio: HTMLAudioElement | undefined;
const playClip: AudioPlayer = (url, done) => {
  audio ??= new Audio();
  const element = audio;
  element.onended = () => done(true);
  element.onerror = () => done(false);
  element.src = url;
  element.play().catch(() => done(false));
  return () => {
    element.onended = element.onerror = null;
    element.pause();
  };
};

// A hundredth of a second of silence, played from a tap to unlock the element.
const SILENCE =
  "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

// Call from a tap (like Start) so iOS lets later clips play without one.
export function unlockAudio() {
  if (typeof Audio === "undefined") return;
  audio ??= new Audio();
  audio.src = SILENCE;
  audio.play().catch(() => {});
}

// One speaker per page, since the browser has one speech queue.
let speaker: Speaker | null | undefined;
function getSpeaker() {
  if (speaker === undefined) {
    speaker =
      typeof window !== "undefined" && "speechSynthesis" in window
        ? createSpeaker(window.speechSynthesis, playClip)
        : null;
  }
  return speaker;
}

const SILENT: SpeakerState = { speaking: false, voices: [] };
const noop = () => () => {};
const subscribe = (listener: () => void) =>
  getSpeaker()?.subscribe(listener) ?? (() => {});
const getState = () => getSpeaker()?.getState() ?? SILENT;

// Text-to-speech for the drill, playing recorded clips where they exist.
// `supported` is false on the server and in browsers without speech, where
// the drill shows the definition instead.
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
    (
      parts: SpeechPart[],
      callbacks: Pick<SpeakOptions, "onFirstDone" | "onDone"> = {},
    ) => getSpeaker()?.speak(parts, { voice, rate, ...callbacks }),
    [voice, rate],
  );
  const cancel = useCallback(() => getSpeaker()?.cancel(), []);

  // Leaving the screen stops the voice mid-sentence.
  useEffect(() => cancel, [cancel]);

  return { supported, speaking, voices, speak, cancel };
}
