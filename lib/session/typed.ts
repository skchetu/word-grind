// What the speller typed, split from the Space-to-replay shortcut. Spelling
// words never contain spaces, so a space is always a command, never a
// letter. It only replays when nothing is typed yet, because replaying
// starts the word over.
//
// A change that adds more than one letter at once is a keyboard suggestion,
// autocorrect, a swipe or a paste, so it's `blocked` and the text stays as
// it was: the speller has to type each letter. Phone keyboards often show
// suggestions even when the page asks them not to.
export function readTyped(previous: string, next: string) {
  const text = next.replace(/\s+/g, "");
  const replay = text !== next && previous === "" && text === "";
  if (lettersAdded(previous, text) > 1) {
    return { text: previous, replay: false, blocked: true };
  }
  return { text, replay, blocked: false };
}

// How many letters `next` puts in place of the part of `previous` that
// changed. Typing one key adds at most one; deleting adds none.
function lettersAdded(previous: string, next: string) {
  let start = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous[start] === next[start]
  ) {
    start++;
  }
  let end = 0;
  while (
    end < previous.length - start &&
    end < next.length - start &&
    previous[previous.length - 1 - end] === next[next.length - 1 - end]
  ) {
    end++;
  }
  return next.length - start - end;
}
