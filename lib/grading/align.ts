import { editGrid } from "./distance";
import { normalize } from "./normalize";

// One step of the letter-by-letter diff, read left to right. `typed` is what
// the speller entered and `expected` is the correct spelling.
export type AlignStep =
  | { op: "keep"; letter: string }
  | { op: "substitute"; typed: string; expected: string }
  | { op: "insert"; expected: string } // missing from the answer
  | { op: "delete"; typed: string } // extra letter in the answer
  | { op: "swap"; typed: string; expected: string }; // two letters, reversed

// Lines up an answer with the correct word so the UI can mark each letter.
// Uses the same edits as `distance`, so the number of non-keep steps always
// equals the distance.
export function align(answer: string, word: string): AlignStep[] {
  const s = Array.from(normalize(answer));
  const t = Array.from(normalize(word));
  const at = editGrid(s, t);
  const steps: AlignStep[] = [];

  // Walk back from the bottom-right cell. At each cell, find a move that
  // explains its value, record it, and step to the cell it came from.
  // Checking "keep" first means matching letters stay lined up.
  let i = s.length;
  let j = t.length;
  while (i > 0 || j > 0) {
    const here = at(i, j);
    const typed = s[i - 1] ?? "";
    const expected = t[j - 1] ?? "";

    if (typed === expected && here === at(i - 1, j - 1)) {
      steps.push({ op: "keep", letter: typed });
      i--;
      j--;
    } else if (
      i > 1 &&
      j > 1 &&
      typed === t[j - 2] &&
      s[i - 2] === expected &&
      here === at(i - 2, j - 2) + 1
    ) {
      steps.push({
        op: "swap",
        typed: `${s[i - 2]}${typed}`,
        expected: `${t[j - 2]}${expected}`,
      });
      i -= 2;
      j -= 2;
    } else if (here === at(i - 1, j - 1) + 1) {
      steps.push({ op: "substitute", typed, expected });
      i--;
      j--;
    } else if (here === at(i - 1, j) + 1) {
      steps.push({ op: "delete", typed });
      i--;
    } else {
      steps.push({ op: "insert", expected });
      j--;
    }
  }

  return steps.reverse();
}
