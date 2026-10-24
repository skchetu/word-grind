"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { saveSession } from "@/app/actions";

import { Button } from "@/components/ui/button";
import { LetterDiff } from "@/components/session/letter-diff";
import { SessionResults } from "@/components/session/session-results";
import { SpellInput, SpellInputHelp } from "@/components/session/spell-input";
import { TestClock } from "@/components/session/test-clock";
import type { DrillWord } from "@/data/seed-words";
import { initialSession, transition, type Mode } from "@/lib/session/machine";
import { unlockAudio, useSpeech } from "@/lib/speech/use-speech";

// A bare-bones drill that runs the session machine end to end. The polished
// drill screen (audio hook, letter diff, shortcuts) replaces it on Day 4.
// Drills and tests of a week's words are saved when they finish; the
// seed-word drill has no `weekId` and isn't. In test mode there are no
// hints or feedback, and a one-hour clock ends the test.
export function BasicDrill({
  words,
  weekId,
  mode = "drill",
}: {
  words: DrillWord[];
  weekId?: string;
  mode?: Mode;
}) {
  const [state, send] = useReducer(transition, initialSession);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // Stable, so the clock's interval isn't restarted on every keystroke.
  const timeUp = useCallback(() => send({ type: "TIME_UP" }), []);
  const word = "index" in state ? words[state.index] : undefined;

  // Time from typing unlocking to submitting, per word. Replays don't reset it.
  const shownAt = useRef<{ index: number; at: number } | null>(null);
  const answerMs = useRef<number[]>([]);
  const answeringIndex = state.phase === "answering" ? state.index : null;
  useEffect(() => {
    if (answeringIndex !== null && shownAt.current?.index !== answeringIndex) {
      shownAt.current = { index: answeringIndex, at: performance.now() };
    }
  }, [answeringIndex]);
  function submit() {
    if (shownAt.current) {
      const { index, at } = shownAt.current;
      answerMs.current[index] = Math.round(performance.now() - at);
    }
    send({ type: "SUBMIT" });
  }

  // Saves once when the session completes. The ref guards against effects
  // running twice in development.
  const [saveFailed, setSaveFailed] = useState(false);
  const saved = useRef(false);
  const results = state.phase === "complete" ? state.results : null;
  useEffect(() => {
    if (!results || !weekId || saved.current) return;
    saved.current = true;
    const answers = results.map((r, i) => ({
      wordId: r.wordId,
      typed: r.answer,
      hintUsed: r.hintUsed,
      ms: answerMs.current[i] ?? 0,
    }));
    saveSession({ weekId, kind: mode, answers })
      .catch(() => false)
      .then((ok) => setSaveFailed(!ok));
  }, [results, weekId, mode]);

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
          setStartedAt(Date.now());
          send({ type: "START", mode, words });
        }}
      >
        {mode === "test"
          ? `Start test (${words.length} words, 1 hour)`
          : `Start drill (${words.length} words)`}
      </Button>
    );
  }

  if (state.phase === "complete") {
    return (
      <SessionResults
        words={state.words}
        results={state.results}
        saveFailed={saveFailed}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          Word {state.index + 1} of {state.words.length}
        </p>
        {mode === "test" && startedAt !== null && (
          <TestClock startedAt={startedAt} onTimeUp={timeUp} />
        )}
      </div>

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
            submit();
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
            {mode === "drill" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => send({ type: "HINT" })}
              >
                Hint
              </Button>
            )}
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
