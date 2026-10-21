import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import fallbackLists from "@/data/fallback-lists.json";
import {
  buildWeekRequest,
  WEEK_SYSTEM_PROMPT,
  type WeekRequest,
} from "./prompts";
import { checkWeek, weekSchema, type WeekOutput } from "./schemas";

export const WEEK_MODEL = "claude-opus-5-5";
const ATTEMPTS = 2;

// Tokens across every attempt, including rejected ones, since all are billed.
export type TokenUsage = { inputTokens: number; outputTokens: number };

export type WeekResult = {
  week: WeekOutput;
  source: "claude" | "fallback";
  usage: TokenUsage;
};

// Asks Claude for a week's list. A bad list (wrong shape, or failing
// checkWeek) gets one more try; an API error (no credit, outage) goes
// straight to a fallback week, since the SDK has already retried it.
export async function generateWeek(
  request: WeekRequest,
  { client = new Anthropic(), weekNumber = 0 } = {},
): Promise<WeekResult> {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse({
        model: WEEK_MODEL,
        max_tokens: 16000,
        system: WEEK_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildWeekRequest(request) }],
        output_config: { effort: "low", format: zodOutputFormat(weekSchema) },
      });
      usage.inputTokens += response.usage.input_tokens;
      usage.outputTokens += response.usage.output_tokens;

      const week = response.parsed_output;
      const problems = week ? checkWeek(week) : ["no parsed output"];
      if (week && problems.length === 0)
        return { week, source: "claude", usage };
      console.warn(`Week attempt ${attempt} rejected:`, problems);
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        console.error(
          `Week generation failed (${error.status}):`,
          error.message,
        );
        break;
      }
      console.warn(`Week attempt ${attempt} didn't parse:`, error);
    }
  }
  return { week: fallbackWeek(weekNumber), source: "fallback", usage };
}

// Rotates through the fallback weeks so two outages in a row differ.
export function fallbackWeek(weekNumber: number): WeekOutput {
  const index = weekNumber % fallbackLists.length;
  return weekSchema.parse(fallbackLists[index]);
}
