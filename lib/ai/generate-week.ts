import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import fallbackLists from "@/data/fallback-lists.json";
import {
  buildTopUpRequest,
  buildWeekRequest,
  WEEK_SYSTEM_PROMPT,
  type WeekRequest,
} from "./prompts";
import {
  checkCard,
  fallbackPoolSchema,
  SENTENCES_PER_WORD,
  weekSchema,
  WORDS_PER_WEEK,
  wordCardSchema,
  type WeekOutput,
  type WordCardOutput,
} from "./schemas";

export const WEEK_MODEL = "claude-opus-5-5";
const DRAFT_ATTEMPTS = 2;

// Tokens across every call, including rejected ones, since all are billed.
export type TokenUsage = { inputTokens: number; outputTokens: number };

export type WeekResult = {
  week: WeekOutput;
  source: "claude" | "fallback";
  usage: TokenUsage;
};

// A card that fails the schema becomes null instead of sinking the whole
// reply, so the good words can be kept. Claude still sees the full card shape.
// Claude is asked for all three sentences, even though backup cards have two.
const claudeCardSchema = wordCardSchema.extend({
  sentences: wordCardSchema.shape.sentences.length(SENTENCES_PER_WORD),
});
const cardsSchema = z.array(claudeCardSchema.nullable().catch(null));
const draftSchema = z.object({
  theme: z.string().trim().min(1),
  // A missing or empty note shouldn't cost a retry; the theme still shows.
  themeNote: z.string().trim().min(1).optional().catch(undefined),
  words: cardsSchema,
});
const topUpSchema = z.object({ words: cardsSchema });

// Builds a week in up to three calls: a draft (retried once only if it has
// no usable theme), then, if dropping bad words left fewer than WORDS_PER_WEEK, a
// top-up asking for just the missing ones. An API error, or still too few
// words, means a fallback week.
export async function generateWeek(
  request: WeekRequest,
  { client = new Anthropic(), weekNumber = 0 } = {},
): Promise<WeekResult> {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  const ask = async <T extends z.ZodType>(content: string, schema: T) => {
    const response = await client.messages.parse({
      model: WEEK_MODEL,
      max_tokens: 16000,
      system: WEEK_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
      output_config: { effort: "low", format: zodOutputFormat(schema) },
    });
    usage.inputTokens += response.usage.input_tokens;
    usage.outputTokens += response.usage.output_tokens;
    return response.parsed_output;
  };

  try {
    let draft: z.infer<typeof draftSchema> | null = null;
    for (let attempt = 1; !draft && attempt <= DRAFT_ATTEMPTS; attempt++) {
      try {
        draft = await ask(buildWeekRequest(request), draftSchema);
      } catch (error) {
        if (error instanceof Anthropic.APIError) throw error;
        console.warn(`Week draft ${attempt} didn't parse:`, error);
      }
    }
    if (!draft) throw new Error("no usable draft");

    const kept = keepGood(draft.words, request.avoid);
    if (kept.length < WORDS_PER_WEEK) {
      const content = buildTopUpRequest(request, {
        theme: draft.theme,
        kept: kept.map((card) => card.word),
        count: WORDS_PER_WEEK - kept.length,
      });
      const extra = await ask(content, topUpSchema);
      kept.push(...keepGood(extra?.words ?? [], request.avoid, kept));
    }

    const week = weekSchema.safeParse({
      theme: draft.theme,
      themeNote: draft.themeNote,
      words: kept,
    });
    if (week.success) return { week: week.data, source: "claude", usage };
    console.warn(`Week still short after top-up: ${kept.length} words`);
  } catch (error) {
    console.error("Week generation failed:", error);
  }
  return { week: fallbackWeek(weekNumber), source: "fallback", usage };
}

// The usable cards, in order: not null, not a repeat or an avoided word,
// and passing checkCard. Stops at WORDS_PER_WEEK.
function keepGood(
  cards: (WordCardOutput | null)[],
  avoid: string[],
  already: WordCardOutput[] = [],
): WordCardOutput[] {
  const taken = new Set([...avoid, ...already.map((card) => card.word)]);
  const kept: WordCardOutput[] = [];
  for (const card of cards) {
    if (!card || taken.has(card.word)) continue;
    const problems = checkCard(card);
    if (problems.length > 0) {
      console.warn("Dropped a word:", problems);
      continue;
    }
    taken.add(card.word);
    kept.push(card);
  }
  return kept.slice(0, WORDS_PER_WEEK - already.length);
}

// Rotates through the fallback pools so two outages in a row differ. Each
// pass through the pools starts WORDS_PER_WEEK words further into each one,
// wrapping around, so every backup word gets used.
export function fallbackWeek(weekNumber: number): WeekOutput {
  const pool = fallbackPoolSchema.parse(
    fallbackLists[weekNumber % fallbackLists.length],
  );
  const start =
    (Math.floor(weekNumber / fallbackLists.length) * WORDS_PER_WEEK) %
    pool.words.length;
  const words = Array.from(
    { length: WORDS_PER_WEEK },
    (_, i) => pool.words[(start + i) % pool.words.length],
  );
  return weekSchema.parse({
    theme: pool.theme,
    themeNote: pool.themeNote,
    words,
  });
}
