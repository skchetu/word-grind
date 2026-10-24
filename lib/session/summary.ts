import type { Result } from "./machine";

// A finished session for the results screen: the score, then the words
// missed (in the order asked) ahead of the ones spelled right, so the
// words worth another look come first.
export function summarize(results: Result[]) {
  const missed = results.filter((r) => !r.correct);
  return {
    correct: results.length - missed.length,
    total: results.length,
    rows: [...missed, ...results.filter((r) => r.correct)],
  };
}
