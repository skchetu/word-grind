// Damerau-Levenshtein distance (the optimal string alignment variant): the
// fewest insertions, deletions, substitutions and adjacent swaps that turn
// `a` into `b`. A swap counts as one edit, so "recieve" is 1 away from
// "receive", not 2.
//
// Strings are split by code point so accented letters count as one letter.
export function distance(a: string, b: string): number {
  const s = Array.from(a);
  const t = Array.from(b);
  // The bottom-right cell compares the whole of s with the whole of t.
  return editGrid(s, t)(s.length, t.length);
}

// Fills the dynamic-programming grid behind `distance` and returns a reader
// for it. `align` walks the same grid backwards to recover which edits were
// made.
export function editGrid(
  s: readonly string[],
  t: readonly string[],
): (i: number, j: number) => number {
  // rows[i][j] is the distance between the first i letters of s and the
  // first j letters of t. The first row and column are the base cases:
  // turning i letters into nothing takes i deletions, and turning nothing
  // into j letters takes j insertions.
  const rows: number[][] = Array.from({ length: s.length + 1 }, (_, i) =>
    Array.from({ length: t.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  // Reads a cell. Out-of-range cells are Infinity so they never win a min.
  const at = (i: number, j: number) => rows[i]?.[j] ?? Infinity;

  // Fill the grid top to bottom, left to right. Each cell only looks at
  // cells above and to the left, which are already filled in.
  for (let i = 1; i <= s.length; i++) {
    const row = rows[i];
    if (!row) continue; // never happens; satisfies noUncheckedIndexedAccess

    for (let j = 1; j <= t.length; j++) {
      // The letters being compared: the i-th of s and the j-th of t.
      const sLetter = s[i - 1];
      const tLetter = t[j - 1];
      // Matching letters carry over for free; different ones cost a
      // substitution.
      const cost = sLetter === tLetter ? 0 : 1;

      // The cheapest of the three Levenshtein moves into this cell.
      let best = Math.min(
        at(i - 1, j) + 1, // delete sLetter
        at(i, j - 1) + 1, // insert tLetter
        at(i - 1, j - 1) + cost, // keep it, or substitute it for tLetter
      );

      // Damerau's addition: if the last two letters of each prefix are the
      // same pair in opposite order ("ie" vs "ei"), swapping them is one
      // edit on top of the distance from two letters back.
      const swapped =
        i > 1 && j > 1 && sLetter === t[j - 2] && s[i - 2] === tLetter;
      if (swapped) {
        best = Math.min(best, at(i - 2, j - 2) + 1);
      }

      row[j] = best;
    }
  }

  return at;
}
