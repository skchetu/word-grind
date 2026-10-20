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

// Each phase carries exactly the data it needs, so impossible states can't
// be represented: there's no `feedback` without a graded result, and no
// typed input outside `answering`.
export type SessionState =
  | { phase: "idle" }
  | { phase: "speaking"; words: WordCard[]; index: number; results: Result[] }
  | {
      phase: "answering";
      words: WordCard[];
      index: number;
      results: Result[];
      input: string;
      hintUsed: boolean;
    }
  | {
      phase: "feedback";
      words: WordCard[];
      index: number;
      results: Result[];
      last: Result;
    }
  | { phase: "complete"; words: WordCard[]; results: Result[] };

export type SessionEvent =
  | { type: "START"; words: WordCard[] }
  | { type: "AUDIO_DONE" }
  | { type: "REPLAY" }
  | { type: "TYPE"; input: string }
  | { type: "HINT" }
  | { type: "SUBMIT" }
  | { type: "NEXT" };

export const initialSession: SessionState = { phase: "idle" };

// The whole drill flow as one pure function. Any event that doesn't apply
// to the current phase returns the same state object, so mashing Enter or
// a late audio callback can't skip a word or grade an answer twice.
export function transition(
  state: SessionState,
  event: SessionEvent,
): SessionState {
  switch (state.phase) {
    case "idle":
      if (event.type === "START" && event.words.length > 0) {
        return { phase: "speaking", words: event.words, index: 0, results: [] };
      }
      return state;

    case "speaking":
      if (event.type === "AUDIO_DONE") {
        const { words, index, results } = state;
        return {
          phase: "answering",
          words,
          index,
          results,
          input: "",
          hintUsed: false,
        };
      }
      return state;

    case "answering": {
      const { words, index, results } = state;
      switch (event.type) {
        case "TYPE":
          return { ...state, input: event.input };
        case "HINT":
          return { ...state, hintUsed: true };
        case "REPLAY":
          return { phase: "speaking", words, index, results };
        case "SUBMIT": {
          const word = words[index];
          // An empty answer is almost always a stray Enter, so ignore it.
          if (!word || state.input.trim() === "") return state;
          const last: Result = {
            wordId: word.id,
            answer: state.input,
            hintUsed: state.hintUsed,
            ...grade(state.input, word.text),
          };
          return {
            phase: "feedback",
            words,
            index,
            results: [...results, last],
            last,
          };
        }
        default:
          return state;
      }
    }

    case "feedback": {
      if (event.type !== "NEXT") return state;
      const { words, index, results } = state;
      const next = index + 1;
      return next < words.length
        ? { phase: "speaking", words, index: next, results }
        : { phase: "complete", words, results };
    }

    case "complete":
      return state;
  }
}
