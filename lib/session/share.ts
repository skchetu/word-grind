import type { Mode, Result } from "./machine";

const SQUARES_PER_ROW = 5;

// "2026-10-27" as "10.27.2026".
function shortDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${month}.${day}.${year}`;
}

// One square per word, in the order asked: green for right, yellow for one
// letter off, red for missed. Never the words themselves, so a result can be
// pasted into a chat without spoiling the list.
export function squares(results: Result[]) {
  const marks = results.map((r) =>
    r.correct ? "🟩" : r.soClose ? "🟨" : "🟥",
  );
  const rows: string[] = [];
  for (let i = 0; i < marks.length; i += SQUARES_PER_ROW) {
    rows.push(marks.slice(i, i + SQUARES_PER_ROW).join(""));
  }
  return rows;
}

// The text "Copy result" puts on the clipboard. `date` is the day of a drill,
// or the Monday of a test's week.
export function shareText(mode: Mode, date: string, results: Result[]) {
  const title =
    mode === "test"
      ? `Sunday Test (week of ${shortDate(date)})`
      : `Daily Grind (${shortDate(date)})`;
  const correct = results.filter((r) => r.correct).length;
  return [
    "Word Grind",
    title,
    ...squares(results),
    `${correct}/${results.length}`,
  ].join("\n");
}
