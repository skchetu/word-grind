// Each word keeps only its newest example sentences. A returning word gets
// a new one each time, so older sentences are deleted once there are more.
export const SENTENCES_KEPT = 3;

type Saved = { id: string; createdAt: string };

// The newest sentence, which is the one the drill shows. Undefined when the
// word has none.
export function newestSentence<T extends Saved>(sentences: T[]): T | undefined {
  return sentences.reduce<T | undefined>(
    (newest, s) => (!newest || s.createdAt > newest.createdAt ? s : newest),
    undefined,
  );
}

// The sentences to delete: all but the newest SENTENCES_KEPT. Sentences
// saved at the same moment (a week's list saves two at once) count as one
// age, so a tie at the cut-off keeps both, matching the database rule.
export function sentencesToPrune<T extends Saved>(sentences: T[]): T[] {
  return sentences.filter(
    (s) =>
      sentences.filter((newer) => newer.createdAt > s.createdAt).length >=
      SENTENCES_KEPT,
  );
}
