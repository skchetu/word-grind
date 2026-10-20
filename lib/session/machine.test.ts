import { describe, expect, it } from "vitest";

import {
  initialSession,
  transition,
  type SessionEvent,
  type SessionState,
} from "./machine";

const words = [
  { id: "w1", text: "rhythm" },
  { id: "w2", text: "receive" },
];

const run = (...events: SessionEvent[]): SessionState =>
  events.reduce(transition, initialSession);

const answer = (input: string): SessionEvent[] => [
  { type: "AUDIO_DONE" },
  { type: "TYPE", input },
  { type: "SUBMIT" },
];

describe("session machine", () => {
  it("starts by speaking the first word", () => {
    expect(run({ type: "START", mode: "drill", words })).toEqual({
      phase: "speaking",
      mode: "drill",
      words,
      index: 0,
      results: [],
    });
  });

  it("does not start without words", () => {
    expect(run({ type: "START", mode: "drill", words: [] })).toBe(
      initialSession,
    );
  });

  it("grades a submitted answer and shows feedback", () => {
    const state = run(
      { type: "START", mode: "drill", words },
      ...answer("rythm"),
    );
    expect(state).toMatchObject({
      phase: "feedback",
      last: { wordId: "w1", correct: false, soClose: true, hintUsed: false },
    });
  });

  it("records when the hint was used", () => {
    const state = run(
      { type: "START", mode: "drill", words },
      { type: "AUDIO_DONE" },
      { type: "HINT" },
      { type: "TYPE", input: "rhythm" },
      { type: "SUBMIT" },
    );
    expect(state).toMatchObject({ last: { correct: true, hintUsed: true } });
  });

  it("goes back to speaking on replay, keeping the same word", () => {
    const state = run(
      { type: "START", mode: "drill", words },
      { type: "AUDIO_DONE" },
      { type: "REPLAY" },
    );
    expect(state).toMatchObject({ phase: "speaking", index: 0 });
  });

  it("moves to the next word, then completes after the last", () => {
    const afterFirst = run(
      { type: "START", mode: "drill", words },
      ...answer("rhythm"),
      {
        type: "NEXT",
      },
    );
    expect(afterFirst).toMatchObject({ phase: "speaking", index: 1 });

    const done = [...answer("recieve"), { type: "NEXT" } as const].reduce(
      transition,
      afterFirst,
    );
    expect(done).toMatchObject({ phase: "complete" });
    if (done.phase !== "complete") return;
    expect(done.results.map((r) => r.correct)).toEqual([true, false]);
  });

  it("ignores an empty submit", () => {
    const answering = run(
      { type: "START", mode: "drill", words },
      { type: "AUDIO_DONE" },
    );
    expect(transition(answering, { type: "SUBMIT" })).toBe(answering);
  });

  it("ignores repeated submits, so an answer is graded once", () => {
    const feedback = run(
      { type: "START", mode: "drill", words },
      ...answer("rhythm"),
    );
    expect(transition(feedback, { type: "SUBMIT" })).toBe(feedback);
    if (feedback.phase !== "feedback") return;
    expect(feedback.results).toHaveLength(1);
  });

  it("ignores events that don't belong to the current phase", () => {
    const speaking = run({ type: "START", mode: "drill", words });
    expect(transition(speaking, { type: "NEXT" })).toBe(speaking);
    expect(transition(speaking, { type: "TYPE", input: "x" })).toBe(speaking);
    expect(transition(initialSession, { type: "SUBMIT" })).toBe(initialSession);
  });
});

describe("test mode", () => {
  const startTest: SessionEvent = { type: "START", mode: "test", words };

  it("ignores hints", () => {
    const answering = run(startTest, { type: "AUDIO_DONE" });
    expect(transition(answering, { type: "HINT" })).toBe(answering);
  });

  it("skips feedback and moves straight to the next word", () => {
    expect(run(startTest, ...answer("rythm"))).toMatchObject({
      phase: "speaking",
      index: 1,
      results: [{ wordId: "w1", correct: false }],
    });
  });

  it("completes after the last answer", () => {
    const done = run(startTest, ...answer("rhythm"), ...answer("receive"));
    expect(done).toMatchObject({ phase: "complete", mode: "test" });
    if (done.phase !== "complete") return;
    expect(done.results.map((r) => r.correct)).toEqual([true, true]);
  });

  it("grades what was typed and misses the rest when time runs out", () => {
    const done = run(
      startTest,
      { type: "AUDIO_DONE" },
      { type: "TYPE", input: "rhythm" },
      { type: "TIME_UP" },
    );
    expect(done).toMatchObject({ phase: "complete" });
    if (done.phase !== "complete") return;
    expect(done.results).toMatchObject([
      { wordId: "w1", answer: "rhythm", correct: true },
      { wordId: "w2", answer: "", correct: false },
    ]);
  });

  it("ignores TIME_UP in a drill", () => {
    const drill = run({ type: "START", mode: "drill", words });
    expect(transition(drill, { type: "TIME_UP" })).toBe(drill);
  });
});
