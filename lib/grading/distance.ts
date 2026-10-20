// Damerau-Levenshtein distance (the optimal string alignment variant): the
// fewest insertions, deletions, substitutions and adjacent swaps that turn
// `a` into `b`. A swap counts as one edit, so "recieve" is 1 away from
// "receive", not 2.
//
// Strings are split by code point so accented letters count as one letter.
export function distance(a: string, b: string): number {
  const s = Array.from(a);
  const t = Array.from(b);

  // rows[i][j] is the distance between the first i letters of s and the
  // first j letters of t.
  const rows: number[][] = Array.from({ length: s.length + 1 }, (_, i) =>
    Array.from({ length: t.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  const at = (i: number, j: number) => rows[i]?.[j] ?? Infinity;

  for (let i = 1; i <= s.length; i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      let best = Math.min(
        at(i - 1, j) + 1, // delete
        at(i, j - 1) + 1, // insert
        at(i - 1, j - 1) + cost, // keep or substitute
      );
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        best = Math.min(best, at(i - 2, j - 2) + 1); // swap
      }
      row[j] = best;
    }
  }

  return at(s.length, t.length);
}
