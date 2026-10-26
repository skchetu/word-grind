export type Review = {
  wordId: string;
  text: string;
  box: number;
  dueOn: string;
};
export type LibraryRow = Review & { misses: number };

// Someone's word library: every word they've reviewed with how often they've
// missed it, in alphabetical order. A search keeps the words containing it,
// ignoring case.
export function libraryRows(
  reviews: readonly Review[],
  missedWordIds: readonly string[],
  search = "",
): LibraryRow[] {
  const misses = new Map<string, number>();
  for (const id of missedWordIds) misses.set(id, (misses.get(id) ?? 0) + 1);
  const needle = search.trim().toLowerCase();
  return reviews
    .filter((r) => r.text.toLowerCase().includes(needle))
    .map((r) => ({ ...r, misses: misses.get(r.wordId) ?? 0 }))
    .toSorted((a, b) => a.text.localeCompare(b.text));
}
