import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { align } from "@/lib/grading/align";
import { describeMistakes } from "@/lib/grading/describe";

import type { TokenUsage } from "./generate-week";
import { buildTipRequest, TIP_SYSTEM_PROMPT } from "./prompts";

// A short, single-turn job, so the small model is plenty.
export const TIP_MODEL = "claude-haiku-5-5";
export const MAX_TIP_WORDS = 30;

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

// The mistakes in plain words, used when Claude's tip can't be had, so the
// tip always matches what was typed. Falls back to the word's saved
// mnemonic only when there's no mistake to describe.
export function plainTip(word: string, wrong: string, mnemonic: string) {
  const mistakes = describeMistakes(align(wrong, word));
  if (mistakes.length === 0) return mnemonic;
  const text = mistakes.join("; ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

// A tip for one specific misspelling. Anything unusable (an API error, an
// empty or rambling reply) falls back to `plainTip`, so the feedback screen
// always has something relevant to show.
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
  return { tip: plainTip(word, wrong, mnemonic), source: "fallback", usage };
}
