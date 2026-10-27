import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import type { TokenUsage } from "./generate-week";
import {
  buildSentencesRequest,
  SENTENCES_SYSTEM_PROMPT,
  type SentenceRequest,
} from "./prompts";
import { toCloze } from "./schemas";

// Short sentences for a handful of words, so the small model is plenty.
export const SENTENCES_MODEL = "claude-haiku-5-5";

const outputSchema = z.object({
  sentences: z.array(z.object({ word: z.string(), sentence: z.string() })),
});

export type NewSentence = { sentence: string; cloze: string };

export type SentencesResult = {
  sentences: Map<string, NewSentence>; // by word; missing words get none
  usage: TokenUsage;
};

// One new sentence for each word, in a single call. A sentence is kept only
// when it was asked for, uses the exact word and isn't a repeat; the cloze
// is built in code. On any failure the map is empty and the drill shows the
// word's saved sentence instead.
export async function generateSentences(
  request: SentenceRequest,
  { client = new Anthropic() } = {},
): Promise<SentencesResult> {
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  const sentences = new Map<string, NewSentence>();
  if (request.words.length === 0) return { sentences, usage };

  try {
    const response = await client.messages.parse({
      model: SENTENCES_MODEL,
      max_tokens: 2000,
      system: SENTENCES_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildSentencesRequest(request) }],
      output_config: { format: zodOutputFormat(outputSchema) },
    });
    usage.inputTokens = response.usage.input_tokens;
    usage.outputTokens = response.usage.output_tokens;

    const asked = new Map(request.words.map((w) => [w.word, w.avoid]));
    for (const { word, sentence } of response.parsed_output?.sentences ?? []) {
      const text = sentence.trim();
      const avoid = asked.get(word);
      const cloze = toCloze(text, word);
      if (!avoid || sentences.has(word) || avoid.includes(text) || !cloze) {
        console.warn(`Dropped a sentence for "${word}"`);
        continue;
      }
      sentences.set(word, { sentence: text, cloze });
    }
  } catch (error) {
    console.error("Sentence generation failed:", error);
  }
  return { sentences, usage };
}
