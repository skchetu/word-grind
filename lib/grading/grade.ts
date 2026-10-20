import { distance } from "./distance";
import { normalize } from "./normalize";

export type Grade = {
  correct: boolean;
  // Edits between the answer and the word, after normalizing both.
  distance: number;
  // One edit away: still wrong, but the UI says "so close".
  soClose: boolean;
};

export function grade(answer: string, word: string): Grade {
  const d = distance(normalize(answer), normalize(word));
  return { correct: d === 0, distance: d, soClose: d === 1 };
}
