import type { AlignStep } from "./align";

// Each mistake in plain words, worked out from the letter diff, such as
// `"u" typed 3 times in a row where "vacuum" has it 2 times`. Claude gets
// these with the tip request so it doesn't have to count or compare letters
// itself, which it often gets wrong.
export function describeMistakes(steps: AlignStep[]): string[] {
  const word = steps
    .map((s) =>
      s.op === "keep" ? s.letter : "expected" in s ? s.expected : "",
    )
    .join("");
  const mistakes: string[] = [];
  let done = ""; // the correct spelling up to this step
  const where = () => (done ? `after "${done}"` : "at the start");

  for (const step of steps) {
    switch (step.op) {
      case "keep":
        done += step.letter;
        break;
      case "substitute":
        mistakes.push(
          `"${step.typed}" instead of "${step.expected}" ${where()}`,
        );
        done += step.expected;
        break;
      case "insert": {
        const run = runAt(word, done.length, step.expected);
        mistakes.push(
          run > 1
            ? `"${step.expected}" typed ${run - 1} ${times(run - 1)} in a row where "${word}" has it ${run} times`
            : `a missing "${step.expected}" ${where()}`,
        );
        done += step.expected;
        break;
      }
      case "delete": {
        const run = runAt(word, done.length, step.typed);
        mistakes.push(
          run > 0
            ? `"${step.typed}" typed ${run + 1} times in a row where "${word}" has it ${run} ${times(run)}`
            : `an extra "${step.typed}" ${where()}`,
        );
        break;
      }
      case "swap":
        mistakes.push(
          `"${step.typed}" swapped, it should be "${step.expected}", ${where()}`,
        );
        done += step.expected;
        break;
    }
  }
  return mistakes;
}

// How many `letter`s in a row the word has around position `at`, so a
// doubled or dropped letter can be described as a count.
function runAt(word: string, at: number, letter: string) {
  let start = at;
  while (start > 0 && word[start - 1] === letter) start--;
  let end = at;
  while (word[end] === letter) end++;
  return end - start;
}

const times = (n: number) => (n === 1 ? "time" : "times");
