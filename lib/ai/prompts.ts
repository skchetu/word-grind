import type { RecapPlayer } from "@/lib/recap/recap";

import { WORDS_PER_WEEK } from "./schemas";

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
  focus?: string[]; // spelling patterns from last week's recap
};

export function buildWeekRequest({
  difficulty,
  topics,
  avoid,
  focus = [],
}: WeekRequest) {
  const lines = [
    `Write this week's list of exactly ${WORDS_PER_WEEK} words, aiming for difficulty ${difficulty}.`,
  ];
  if (focus.length > 0) {
    lines.push(
      `Include words that practise these patterns from last week's misses: ${focus.join("; ")}.`,
    );
  }
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

export const SENTENCES_SYSTEM_PROMPT = `You write example sentences for adults learning GRE-level English words.

For each word, write one new sentence that uses the exact word, not another form of it, and makes its meaning clear from context.
Keep each sentence under 25 words, and make it different from the sentences already listed for that word.`;

export type SentenceRequest = {
  words: { word: string; avoid: string[] }[]; // avoid: the word's saved sentences
  topics: string[];
};

export function buildSentencesRequest({ words, topics }: SentenceRequest) {
  const lines = words.map(({ word, avoid }) =>
    avoid.length > 0
      ? `- ${word} (already used: ${avoid.map((s) => `"${s}"`).join(" ")})`
      : `- ${word}`,
  );
  if (topics.length > 0) {
    lines.push(`Set the sentences around: ${topics.join(", ")}.`);
  }
  return `Write one new sentence for each word:\n${lines.join("\n")}`;
}

export const RECAP_SYSTEM_PROMPT = `You write a short, friendly recap of a household's weekly spelling test.

You get each person's score and their misspellings (the word and what they typed).
- headline: one line saying who won and by how much, or that it was a tie. Light and encouraging, at most 120 characters.
- sharedPatterns: up to 3 spelling patterns behind the misses, such as "doubled consonants" or "-ence vs -ance". Prefer patterns more than one person struggled with. Empty if there were no misses.
- nextWeekFocus: up to 3 short patterns next week's list should practise.`;

export function buildRecapRequest(players: RecapPlayer[]) {
  return players
    .map((p) => {
      const misses = p.misses.length
        ? p.misses.map((m) => `${m.word} (typed "${m.typed}")`).join(", ")
        : "none";
      return `${p.name}: ${p.score}/${p.total}. Misses: ${misses}`;
    })
    .join("\n");
}
