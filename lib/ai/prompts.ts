// Stable instructions, kept identical across requests so they can be cached.
export const WEEK_SYSTEM_PROMPT = `You write weekly spelling and vocabulary lists for two adults studying GRE-level English.

Pick words that are genuinely hard to spell (doubled letters, silent letters, look-alike endings), not just rare.
Each word must be a single lowercase English word with no spaces or hyphens.
Both example sentences must use the exact word, not another form of it.
Syllables, joined together, must spell the word exactly.
The mnemonic is one short hint about the tricky letters.
Rate difficulty from 1 (common, few traps) to 5 (rare, several traps).
Give the week a short, playful theme that ties the words together.`;

export type WeekRequest = {
  difficulty: number; // 1 to 5, the household's target
  topics: string[]; // used for example sentences
  avoid: string[]; // words from recent weeks
};

export function buildWeekRequest({ difficulty, topics, avoid }: WeekRequest) {
  const lines = [
    `Write this week's list of 12 to 15 words, aiming for difficulty ${difficulty}.`,
  ];
  if (topics.length > 0) {
    lines.push(`Set the example sentences around: ${topics.join(", ")}.`);
  }
  if (avoid.length > 0) {
    lines.push(`Don't use any of these recent words: ${avoid.join(", ")}.`);
  }
  return lines.join("\n");
}

// Asks for just enough words to refill a list after bad ones were dropped,
// so they fit the theme and don't repeat what's already there.
export function buildTopUpRequest(
  request: WeekRequest,
  { theme, kept, count }: { theme: string; kept: string[]; count: number },
) {
  const lines = [
    `This week's theme is "${theme}". Write ${count} more words for it, aiming for difficulty ${request.difficulty}.`,
    `Don't use any of these words: ${[...kept, ...request.avoid].join(", ")}.`,
  ];
  if (request.topics.length > 0) {
    lines.push(
      `Set the example sentences around: ${request.topics.join(", ")}.`,
    );
  }
  return lines.join("\n");
}

export const TIP_SYSTEM_PROMPT = `You coach adults on English spelling.

You get a word and how someone misspelled it. Reply with one tip, at most 20 words, about their specific mistake: which letters went wrong and a way to remember the right ones.
Reply with the tip only: no greeting, no quotes, and don't repeat their misspelling.`;

export function buildTipRequest(word: string, wrong: string) {
  return `Word: ${word}\nThey typed: ${wrong}`;
}
