import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { recapSchema, type Recap, type RecapPlayer } from "@/lib/recap/recap";

import type { TokenUsage } from "./generate-week";
import { buildRecapRequest, RECAP_SYSTEM_PROMPT } from "./prompts";

// Once a week, and finding patterns across misspellings benefits from a
// stronger model than the one-line tips, at a cost of about a cent.
export const RECAP_MODEL = "claude-sonnet-5-5";

export type RecapResult = { recap: Recap | null; usage: TokenUsage };

// The week's recap, or null when Claude can't be reached or replies with
// something unusable. A missing recap is simply skipped on screen.
export async function generateRecap(
  players: RecapPlayer[],
  { client = new Anthropic() } = {},
): Promise<RecapResult> {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  try {
    const response = await client.messages.parse({
      model: RECAP_MODEL,
      max_tokens: 1000,
      system: RECAP_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildRecapRequest(players) }],
      output_config: { format: zodOutputFormat(recapSchema) },
    });
    usage.inputTokens = response.usage.input_tokens;
    usage.outputTokens = response.usage.output_tokens;
    return { recap: response.parsed_output, usage };
  } catch (error) {
    console.error("Recap generation failed:", error);
    return { recap: null, usage };
  }
}
