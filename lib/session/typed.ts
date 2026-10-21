// What the speller typed, split from the Space-to-replay shortcut. Spelling
// words never contain spaces, so a space is always a command, never a
// letter. It only replays when nothing is typed yet, because replaying
// starts the word over.
export function readTyped(previous: string, next: string) {
  const text = next.replace(/\s+/g, "");
  return { text, replay: text !== next && previous === "" && text === "" };
}
