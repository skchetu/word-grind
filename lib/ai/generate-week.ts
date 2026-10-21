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
  MAX_WORDS,
  MIN_WORDS,
  weekSchema,
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
const cardsSchema = z.array(wordCardSchema.nullable().catch(null));
const draftSchema = z.object({
  theme: z.string().trim().min(1),
  words: cardsSchema,
});
const topUpSchema = z.object({ words: cardsSchema });

// Builds a week in up to three calls: a draft (retried once only if it has
// no usable theme), then, if dropping bad words left fewer than MIN_WORDS, a
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
    if (kept.length < MIN_WORDS) {
      const content = buildTopUpRequest(request, {
        theme: draft.theme,
        kept: kept.map((card) => card.word),
        count: MIN_WORDS - kept.length,
      });
      const extra = await ask(content, topUpSchema);
      kept.push(...keepGood(extra?.words ?? [], request.avoid, kept));
    }

    const week = weekSchema.safeParse({ theme: draft.theme, words: kept });
    if (week.success) return { week: week.data, source: "claude", usage };
    console.warn(`Week still short after top-up: ${kept.length} words`);
  } catch (error) {
    console.error("Week generation failed:", error);
  }
  return { week: fallbackWeek(weekNumber), source: "fallback", usage };
}

// The usable cards, in order: not null, not a repeat or an avoided word,
// and passing checkCard. Stops at MAX_WORDS.
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
  return kept.slice(0, MAX_WORDS - already.length);
}

// Rotates through the fallback weeks so two outages in a row differ.
export function fallbackWeek(weekNumber: number): WeekOutput {
  const index = weekNumber % fallbackLists.length;
  return weekSchema.parse(fallbackLists[index]);
}
