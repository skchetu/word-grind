import { z } from "zod";

// Claude's recap of a week, as it returns it and as it's saved.
export const recapSchema = z.object({
  headline: z.string().trim().min(1).max(120), // who won, in one line
  sharedPatterns: z.array(z.string().trim().min(1)).max(3),
  nextWeekFocus: z.array(z.string().trim().min(1)).max(3),
});
export type Recap = z.infer<typeof recapSchema>;

// One answer from a Sunday test.
export type TestAnswer = {
  profileId: string;
  word: string;
  typed: string;
  correct: boolean;
};

export type RecapPlayer = {
  name: string;
  score: number;
  total: number;
  misses: { word: string; typed: string }[];
};

// Each member's score and misspellings, for the recap prompt. Null until
// every member has taken the test, since the recap compares everyone.
export function recapPlayers(
  members: { id: string; name: string }[],
  answers: TestAnswer[],
): RecapPlayer[] | null {
  const players = members.map((member) => {
    const own = answers.filter((a) => a.profileId === member.id);
    return {
      name: member.name,
      score: own.filter((a) => a.correct).length,
      total: own.length,
      misses: own
        .filter((a) => !a.correct)
        .map(({ word, typed }) => ({ word, typed })),
    };
  });
  return players.length > 0 && players.every((p) => p.total > 0)
    ? players
    : null;
}
