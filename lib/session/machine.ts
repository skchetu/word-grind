import { grade } from "@/lib/grading/grade";

export type WordCard = { id: string; text: string };

export type Result = {
  wordId: string;
  answer: string;
  correct: boolean;
  distance: number;
  soClose: boolean;
  hintUsed: boolean;
};

// Drills show feedback after every word and allow hints. Tests are the
// Sunday exam: no hints, no feedback until the end, and a time limit.
export type Mode = "drill" | "test";

type Base = { mode: Mode; words: WordCard[]; results: Result[] };

// Each phase carries exactly the data it needs, so impossible states can't
// be represented: there's no `feedback` without a graded result, and no
// typed input outside `answering`.
export type SessionState =
  | { phase: "idle" }
  // `input` and `hintUsed` survive a replay, so hearing the word again
  // neither wipes the answer nor hides that a hint was used.
  | (Base & {
      phase: "speaking";
      index: number;
      input: string;
      hintUsed: boolean;
    })
  | (Base & {
      phase: "answering";
      index: number;
      input: string;
      hintUsed: boolean;
    })
  | (Base & { phase: "feedback"; index: number; last: Result })
  | (Base & { phase: "complete" });

export type SessionEvent =
  | { type: "START"; mode: Mode; words: WordCard[] }
  | { type: "AUDIO_DONE" }
  | { type: "REPLAY" }
  | { type: "TYPE"; input: string }
  | { type: "HINT" }
  | { type: "SUBMIT" }
  | { type: "NEXT" }
  | { type: "TIME_UP" };

export const initialSession: SessionState = { phase: "idle" };

// A word starts with an empty answer and no hint.
const fresh = { input: "", hintUsed: false };

function score(word: WordCard, answer: string, hintUsed: boolean): Result {
  return { wordId: word.id, answer, hintUsed, ...grade(answer, word.text) };
}

// Speaks the word after `index`, or finishes when there are none left.
function advance({ mode, words, results }: Base, index: number): SessionState {
  const next = index + 1;
  return next < words.length
    ? { ...fresh, phase: "speaking", mode, words, results, index: next }
    : { phase: "complete", mode, words, results };
}

// The whole session flow as one pure function. Any event that doesn't apply
// to the current phase returns the same state object, so mashing Enter or
// a late audio callback can't skip a word or grade an answer twice.
export function transition(
  state: SessionState,
  event: SessionEvent,
): SessionState {
  if (state.phase === "idle") {
    if (event.type !== "START" || event.words.length === 0) return state;
    const { mode, words } = event;
    return { ...fresh, phase: "speaking", mode, words, results: [], index: 0 };
  }

  // When a test's time runs out, the word on screen is graded as typed so
  // far and every remaining word counts as missed.
  if (
    event.type === "TIME_UP" &&
    state.mode === "test" &&
    (state.phase === "speaking" || state.phase === "answering")
  ) {
    const { mode, words, index } = state;
    const missed = words
      .slice(index)
      .map((word, i) => score(word, i === 0 ? state.input : "", false));
    return {
      phase: "complete",
      mode,
      words,
      results: [...state.results, ...missed],
    };
  }

  switch (state.phase) {
    case "speaking": {
      if (event.type !== "AUDIO_DONE") return state;
      return { ...state, phase: "answering" };
    }

    case "answering": {
      const { mode, words, results, index } = state;
      switch (event.type) {
        case "TYPE":
          return { ...state, input: event.input };
        case "HINT":
          return mode === "drill" ? { ...state, hintUsed: true } : state;
        case "REPLAY":
          return { ...state, phase: "speaking" };
        case "SUBMIT": {
          const word = words[index];
          // An empty answer is almost always a stray Enter, so ignore it.
          if (!word || state.input.trim() === "") return state;
          const last = score(word, state.input, state.hintUsed);
          const graded = { mode, words, results: [...results, last] };
          // Tests move straight on; results are revealed at the end.
          return mode === "test"
            ? advance(graded, index)
            : { phase: "feedback", ...graded, index, last };
        }
        default:
          return state;
      }
    }

    case "feedback":
      return event.type === "NEXT" ? advance(state, state.index) : state;

    case "complete":
      return state;
  }
}
