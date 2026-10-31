type Saved = { id: string; createdAt: string };

// The newest sentence, which is the one the drill shows. Undefined when the
// word has none.
export function newestSentence<T extends Saved>(sentences: T[]): T | undefined {
  return sentences.reduce<T | undefined>(
    (newest, s) => (!newest || s.createdAt > newest.createdAt ? s : newest),
    undefined,
  );
}
