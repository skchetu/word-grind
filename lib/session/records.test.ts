import { describe, expect, it } from "vitest";

import { drillRecords, type Answer } from "./records";

const today = "2026-10-23";
const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const texts = new Map([
  [A, "laconic"],
  [B, "ephemeral"],
]);
const answer = (wordId: string, typed: string): Answer => ({
  wordId,
  typed,
  hintUsed: false,
  ms: 4000,
});

describe("drillRecords", () => {
  it("grades on the server and scores the drill", () => {
    const r = drillRecords(
      [answer(A, "Laconic"), answer(B, "ephemoral")],
      texts,
      new Map(),
      today,
    );
    expect(r).toMatchObject({ score: 1, total: 2 });
    expect(r.attempts[1]).toMatchObject({
      typed: "ephemoral",
      correct: false,
      edit_distance: 1,
    });
  });

  it("moves new words from box 1 and existing words from their box", () => {
    const states = new Map([
      [A, { box: 3, dueOn: today, correctStreak: 2, lapses: 0 }],
    ]);
    const r = drillRecords(
      [answer(A, "laconic"), answer(B, "laconic")],
      texts,
      states,
      today,
    );
    expect(r.reviews).toEqual([
      {
        word_id: A,
        box: 4,
        due_on: "2026-10-30",
        correct_streak: 3,
        lapses: 0,
      },
      {
        word_id: B,
        box: 1,
        due_on: "2026-10-24",
        correct_streak: 0,
        lapses: 1,
      },
    ]);
  });

  it("drops unknown words and caps the answer time at an hour", () => {
    const r = drillRecords(
      [{ ...answer(A, "laconic"), ms: 9e7 }, answer(B.replace("b", "c"), "x")],
      texts,
      new Map(),
      today,
    );
    expect(r.total).toBe(1);
    expect(r.attempts[0]?.ms_to_answer).toBe(3_600_000);
  });
});
