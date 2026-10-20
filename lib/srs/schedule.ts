import { z } from "zod";

// A calendar date as stored in Postgres `date` columns: "2026-10-20".
// Plain strings avoid time-zone shifts that a JavaScript Date would bring.
const isoDate = z.iso.date();

// One person's progress on one word (a `review_state` row).
export const reviewStateSchema = z.object({
  box: z.int().min(1).max(5),
  dueOn: isoDate,
  correctStreak: z.int().min(0),
  lapses: z.int().min(0),
});
export type ReviewState = z.infer<typeof reviewStateSchema>;

// Days until the next review for each Leitner box. Index 0 is unused so
// the box number reads directly as the index.
export const INTERVALS = [0, 1, 2, 4, 7, 14] as const;

export const MASTERED_BOX = 4;

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// A new word starts in box 1, due right away.
export function initialState(today: string): ReviewState {
  return { box: 1, dueOn: today, correctStreak: 0, lapses: 0 };
}

// Moves a word after an answer: up one box when correct (up to 5), back to
// box 1 when wrong. Higher boxes come back less often.
export function schedule(
  state: ReviewState,
  correct: boolean,
  today: string,
): ReviewState {
  const box = correct ? Math.min(state.box + 1, 5) : 1;
  return {
    box,
    // box is always 1 to 5 here, so the lookup can't miss.
    dueOn: addDays(today, INTERVALS[box as 1 | 2 | 3 | 4 | 5]),
    correctStreak: correct ? state.correctStreak + 1 : 0,
    lapses: correct ? state.lapses : state.lapses + 1,
  };
}

// ISO dates compare correctly as strings.
export function isDue(state: ReviewState, today: string): boolean {
  return state.dueOn <= today;
}

export function isMastered(state: ReviewState): boolean {
  return state.box >= MASTERED_BOX;
}
