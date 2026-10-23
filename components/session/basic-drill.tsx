"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";

import { Button } from "@/components/ui/button";
import { LetterDiff } from "@/components/session/letter-diff";
import { SpellInput, SpellInputHelp } from "@/components/session/spell-input";
import type { DrillWord } from "@/data/seed-words";
import { initialSession, transition } from "@/lib/session/machine";
import { unlockAudio, useSpeech } from "@/lib/speech/use-speech";

// A bare-bones drill that runs the session machine end to end. The polished
// drill screen (audio hook, letter diff, shortcuts) replaces it on Day 4.
export function BasicDrill({ words }: { words: DrillWord[] }) {
  const [state, send] = useReducer(transition, initialSession);
  const word = "index" in state ? words[state.index] : undefined;

  // Read the word aloud on entering `speaking`; typing unlocks when it ends.
  const { speak } = useSpeech();
  const speakingIndex = state.phase === "speaking" ? state.index : null;
  useEffect(() => {
    const current = speakingIndex === null ? undefined : words[speakingIndex];
    if (current) {
      speak([{ text: current.text, audioUrl: current.audioUrl }], () =>
        send({ type: "AUDIO_DONE" }),
      );
    }
  }, [speakingIndex, words, speak]);
  const recorded = words.some((w) => w.audioUrl);

  if (state.phase === "idle") {
    return (
      <Button
        size="lg"
        onClick={() => {
          unlockAudio();
          send({ type: "START", mode: "drill", words });
        }}
      >
        Start drill ({words.length} words)
      </Button>
    );
  }

  if (state.phase === "complete") {
    const correct = state.results.filter((r) => r.correct).length;
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-2xl font-semibold">
          {correct} / {state.results.length} correct
        </p>
        <Button asChild variant="outline">
          <Link href="/">Done</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Word {state.index + 1} of {state.words.length}
      </p>

      {state.phase === "speaking" && (
        // Some browsers block speech or never fire `onend`, so the speller
        // can always move on by hand.
        <Button onClick={() => send({ type: "AUDIO_DONE" })}>
          Listening… tap to type
        </Button>
      )}

      {state.phase === "answering" && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            send({ type: "SUBMIT" });
          }}
        >
          <SpellInput
            value={state.input}
            onChange={(input) => send({ type: "TYPE", input })}
            onReplay={() => send({ type: "REPLAY" })}
          />
          <SpellInputHelp />
          {state.hintUsed && word && (
            <p className="text-sm text-muted-foreground">
              Hint: {word.definition}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => send({ type: "REPLAY" })}
            >
              Replay
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => send({ type: "HINT" })}
            >
              Hint
            </Button>
            <Button type="submit" className="ml-auto">
              Submit
            </Button>
          </div>
        </form>
      )}

      {state.phase === "feedback" && word && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className="text-lg font-medium">
            {state.last.correct
              ? "Correct!"
              : state.last.soClose
                ? "So close!"
                : "Not quite."}
          </p>
          {!state.last.correct && (
            <LetterDiff answer={state.last.answer} word={word.text} />
          )}
          <Button autoFocus onClick={() => send({ type: "NEXT" })}>
            Next
          </Button>
        </div>
      )}

      {recorded && (
        // ElevenLabs' free plan asks for credit wherever its audio is used.
        <p className="text-center text-xs text-muted-foreground">
          Voice by{" "}
          <a
            href="https://elevenlabs.io"
            className="underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            elevenlabs.io
          </a>
        </p>
      )}
    </div>
  );
}
