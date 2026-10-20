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
    expect(run({ type: "START", words })).toEqual({
      phase: "speaking",
      words,
      index: 0,
      results: [],
    });
  });

  it("does not start without words", () => {
    expect(run({ type: "START", words: [] })).toBe(initialSession);
  });

  it("grades a submitted answer and shows feedback", () => {
    const state = run({ type: "START", words }, ...answer("rythm"));
    expect(state).toMatchObject({
      phase: "feedback",
      last: { wordId: "w1", correct: false, soClose: true, hintUsed: false },
    });
  });

  it("records when the hint was used", () => {
    const state = run(
      { type: "START", words },
      { type: "AUDIO_DONE" },
      { type: "HINT" },
      { type: "TYPE", input: "rhythm" },
      { type: "SUBMIT" },
    );
    expect(state).toMatchObject({ last: { correct: true, hintUsed: true } });
  });

  it("goes back to speaking on replay, keeping the same word", () => {
    const state = run(
      { type: "START", words },
      { type: "AUDIO_DONE" },
      { type: "REPLAY" },
    );
    expect(state).toMatchObject({ phase: "speaking", index: 0 });
  });

  it("moves to the next word, then completes after the last", () => {
    const afterFirst = run({ type: "START", words }, ...answer("rhythm"), {
      type: "NEXT",
    });
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
    const answering = run({ type: "START", words }, { type: "AUDIO_DONE" });
    expect(transition(answering, { type: "SUBMIT" })).toBe(answering);
  });

  it("ignores repeated submits, so an answer is graded once", () => {
    const feedback = run({ type: "START", words }, ...answer("rhythm"));
    expect(transition(feedback, { type: "SUBMIT" })).toBe(feedback);
    if (feedback.phase !== "feedback") return;
    expect(feedback.results).toHaveLength(1);
  });

  it("ignores events that don't belong to the current phase", () => {
    const speaking = run({ type: "START", words });
    expect(transition(speaking, { type: "NEXT" })).toBe(speaking);
    expect(transition(speaking, { type: "TYPE", input: "x" })).toBe(speaking);
    expect(transition(initialSession, { type: "SUBMIT" })).toBe(initialSession);
  });
});
