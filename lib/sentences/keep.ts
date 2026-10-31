type Saved = { id: string; createdAt: string };

// The newest sentence. Undefined when the word has none.
export function newestSentence<T extends Saved>(sentences: T[]): T | undefined {
  return sentences.reduce<T | undefined>(
    (newest, s) => (!newest || s.createdAt > newest.createdAt ? s : newest),
    undefined,
  );
}

// The sentence for someone's `turn`th time seeing the word, counting from 0:
// the word's sentences oldest first, moving on one each time.
export function sentenceForTurn<T extends Saved>(
  sentences: T[],
  turn: number,
): T | undefined {
  const ordered = sentences.toSorted(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  return ordered[turn % ordered.length];
}
