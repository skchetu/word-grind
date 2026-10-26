import { z } from "zod";

export const MAX_TOPICS = 8;

// "food, Travel , food,," → ["food", "Travel"]: trimmed, blanks dropped,
// repeats removed ignoring case, at most MAX_TOPICS.
export function parseTopics(input: string): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const raw of input.split(",")) {
    const topic = raw.trim();
    const key = topic.toLowerCase();
    if (!topic || seen.has(key)) continue;
    seen.add(key);
    topics.push(topic);
  }
  return topics.slice(0, MAX_TOPICS);
}

// The profile form: a name to show on the scoreboard, and topics Claude
// uses for example sentences.
export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(30, "Keep the name to 30 characters."),
  topics: z
    .string()
    .transform(parseTopics)
    .pipe(z.array(z.string().max(40, "Keep each topic to 40 characters."))),
});
