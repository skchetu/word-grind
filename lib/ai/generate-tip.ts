import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { align } from "@/lib/grading/align";
import { describeMistakes } from "@/lib/grading/describe";

import type { TokenUsage } from "./generate-week";
import { buildTipRequest, TIP_SYSTEM_PROMPT } from "./prompts";

// A short, single-turn job, so the small model is plenty.
export const TIP_MODEL = "claude-haiku-5-5";
export const MAX_TIP_WORDS = 20;

const tipSchema = z
  .string()
  .trim()
  .min(1)
  .refine((tip) => tip.split(/\s+/).length <= MAX_TIP_WORDS, "tip too long");

export type TipResult = {
  tip: string;
  source: "claude" | "fallback";
  usage: TokenUsage;
};

// A tip for one specific misspelling. Anything unusable (an API error, an
// empty or rambling reply) falls back to the word's saved mnemonic, so the
// feedback screen always has something to show.
export async function generateTip(
  { word, wrong, mnemonic }: { word: string; wrong: string; mnemonic: string },
  { client = new Anthropic() } = {},
): Promise<TipResult> {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

  try {
    const response = await client.messages.create({
      model: TIP_MODEL,
      max_tokens: 200,
      system: TIP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildTipRequest(
            word,
            wrong,
            describeMistakes(align(wrong, word)),
          ),
        },
      ],
    });
    usage.inputTokens = response.usage.input_tokens;
    usage.outputTokens = response.usage.output_tokens;

    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("");
    const tip = tipSchema.safeParse(text);
    if (tip.success) return { tip: tip.data, source: "claude", usage };
    console.warn("Tip rejected:", tip.error.issues[0]?.message);
  } catch (error) {
    console.error("Tip generation failed:", error);
  }
  return { tip: mnemonic, source: "fallback", usage };
}
