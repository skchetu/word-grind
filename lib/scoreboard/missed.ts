export type Miss = { profileId: string; word: string };
export type MissedWord = { word: string; misses: number };

// Each person's most-missed words: the words they got wrong most often,
// ties in alphabetical order, at most `limit` each.
export function mostMissed(
  misses: readonly Miss[],
  limit = 3,
): Map<string, MissedWord[]> {
  const counts = new Map<string, Map<string, number>>();
  for (const { profileId, word } of misses) {
    const words = counts.get(profileId) ?? new Map<string, number>();
    words.set(word, (words.get(word) ?? 0) + 1);
    counts.set(profileId, words);
  }
  return new Map(
    [...counts].map(([profileId, words]) => [
      profileId,
      [...words]
        .map(([word, n]) => ({ word, misses: n }))
        .toSorted((a, b) => b.misses - a.misses || a.word.localeCompare(b.word))
        .slice(0, limit),
    ]),
  );
}
